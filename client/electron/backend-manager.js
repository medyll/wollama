const DEFAULT_START_TIMEOUT_MS = 20_000;
const DEFAULT_POLL_INTERVAL_MS = 250;

const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export class BackendManager {
	constructor({
		url,
		startProcess,
		fetchImpl = globalThis.fetch,
		startTimeoutMs = DEFAULT_START_TIMEOUT_MS,
		pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
		logger = console
	}) {
		this.url = url;
		this.startProcess = startProcess;
		this.fetchImpl = fetchImpl;
		this.startTimeoutMs = startTimeoutMs;
		this.pollIntervalMs = pollIntervalMs;
		this.logger = logger;
		this.child = null;
		this.startPromise = null;
		this.status = 'stopped';
		this.error = null;
		this.ownsProcess = false;
	}

	getStatus() {
		return {
			url: this.url,
			status: this.status,
			error: this.error,
			managed: this.ownsProcess
		};
	}

	async isHealthy() {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 1_500);

		try {
			const response = await this.fetchImpl(`${this.url}/api/health`, {
				signal: controller.signal
			});

			if (!response.ok) return false;
			const data = await response.json();
			return data?.service === 'wollama' && data?.status === 'ok';
		} catch {
			return false;
		} finally {
			clearTimeout(timeout);
		}
	}

	async ensureStarted() {
		if (this.startPromise) return this.startPromise;

		this.startPromise = this.start().finally(() => {
			this.startPromise = null;
		});

		return this.startPromise;
	}

	async restart() {
		if (this.child) {
			this.status = 'stopping';
			const child = this.child;
			await new Promise((resolve) => {
				const timeout = setTimeout(resolve, 1_000);
				child.once('exit', () => {
					clearTimeout(timeout);
					resolve();
				});
				child.kill();
			});

			if (this.child === child) this.child = null;
			this.ownsProcess = false;
		}

		return this.ensureStarted();
	}

	stop() {
		this.status = 'stopped';
		this.error = null;

		if (this.child) {
			this.child.kill();
			this.child = null;
		}

		this.ownsProcess = false;
	}

	async start() {
		this.status = 'starting';
		this.error = null;

		if (await this.isHealthy()) {
			this.status = 'running';
			this.ownsProcess = false;
			return this.getStatus();
		}

		try {
			const child = this.startProcess();
			this.child = child;
			this.ownsProcess = true;

			child.once('exit', (code) => {
				if (this.child !== child) return;

				this.child = null;
				this.ownsProcess = false;

				if (this.status !== 'stopped' && this.status !== 'stopping') {
					this.status = 'failed';
					this.error = `The packaged backend exited with code ${code ?? 'unknown'}.`;
					this.logger.error(this.error);
				}
			});
		} catch (error) {
			this.status = 'failed';
			this.error = error instanceof Error ? error.message : String(error);
			throw error;
		}

		const deadline = Date.now() + this.startTimeoutMs;
		while (Date.now() < deadline) {
			if (await this.isHealthy()) {
				this.status = 'running';
				this.error = null;
				return this.getStatus();
			}

			if (!this.child) break;
			await delay(this.pollIntervalMs);
		}

		if (this.child) {
			this.child.kill();
			this.child = null;
		}

		this.ownsProcess = false;
		this.status = 'failed';
		this.error = `The packaged backend did not become ready at ${this.url}.`;
		throw new Error(this.error);
	}
}
