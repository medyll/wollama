import { execFile, execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'server');
const SUPERVISOR_PATH = fileURLToPath(new URL('./e2e-server-supervisor.mjs', import.meta.url));
const requireFromServer = createRequire(path.join(SERVER_DIR, 'package.json'));
const activeServers = new Set<ChildProcess>();
const stopPromises = new WeakMap<ChildProcess, Promise<void>>();

let hooksInstalled = false;
let handlingSignal = false;

export interface E2EServer {
	process: ChildProcess;
	databasePath: string;
	stop: () => Promise<void>;
}

export interface StartE2EServerOptions {
	port: number;
	databasePrefix: string;
	env?: NodeJS.ProcessEnv;
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
	if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);

	return new Promise((resolve) => {
		const timeout = setTimeout(() => {
			child.off('exit', onExit);
			resolve(false);
		}, timeoutMs);
		const onExit = () => {
			clearTimeout(timeout);
			resolve(true);
		};
		child.once('exit', onExit);
	});
}

function runTaskkill(pid: number): Promise<void> {
	return new Promise((resolve, reject) => {
		execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true }, (error) => {
			if (error) reject(error);
			else resolve();
		});
	});
}

/** Stops only the process tree rooted at the child created by the caller. */
export function stopProcessTree(child: ChildProcess): Promise<void> {
	const existingStop = stopPromises.get(child);
	if (existingStop) return existingStop;

	const stop = (async () => {
		const pid = child.pid;
		if (!pid) return;

		if (process.platform === 'win32') {
			try {
				await runTaskkill(pid);
			} catch (error) {
				// taskkill reports an error when the process finished between the PID check and the command.
				if (child.exitCode === null && child.signalCode === null) throw error;
			}
			if (!(await waitForExit(child, 10_000))) throw new Error(`Timed out while stopping process tree ${pid}`);
			return;
		}

		try {
			process.kill(-pid, 'SIGTERM');
		} catch (error) {
			if (child.exitCode === null && child.signalCode === null) throw error;
			return;
		}

		if (!(await waitForExit(child, 5_000))) {
			try {
				process.kill(-pid, 'SIGKILL');
			} catch {
				// The group exited between the timeout and the forced stop.
			}
			if (!(await waitForExit(child, 5_000))) throw new Error(`Timed out while force-stopping process group ${pid}`);
		}
	})();

	stopPromises.set(child, stop);
	return stop;
}

function stopActiveServersSync() {
	for (const child of activeServers) {
		const pid = child.pid;
		if (!pid) continue;

		try {
			if (process.platform === 'win32') {
				execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
			} else {
				process.kill(-pid, 'SIGKILL');
			}
		} catch {
			// Best-effort fallback during process shutdown; normal teardown awaits stopProcessTree().
		}
	}
	activeServers.clear();
}

function onExit() {
	stopActiveServersSync();
}

function forwardSignal(signal: NodeJS.Signals) {
	if (handlingSignal) return;
	handlingSignal = true;
	stopActiveServersSync();
	removeShutdownHooks();
	process.kill(process.pid, signal);
}

function onSigint() {
	forwardSignal('SIGINT');
}

function onSigterm() {
	forwardSignal('SIGTERM');
}

function installShutdownHooks() {
	if (hooksInstalled) return;
	hooksInstalled = true;
	process.on('exit', onExit);
	process.on('SIGINT', onSigint);
	process.on('SIGTERM', onSigterm);
}

function removeShutdownHooks() {
	if (!hooksInstalled) return;
	hooksInstalled = false;
	handlingSignal = false;
	process.off('exit', onExit);
	process.off('SIGINT', onSigint);
	process.off('SIGTERM', onSigterm);
}

export function startE2EServer(options: StartE2EServerOptions): E2EServer {
	const databasePath = mkdtempSync(path.join(os.tmpdir(), `${options.databasePrefix}-`));
	const tsxCli = requireFromServer.resolve('tsx/cli');
	const supervisorConfig = Buffer.from(
		JSON.stringify({ command: process.execPath, args: [tsxCli, 'server.ts'], cwd: SERVER_DIR })
	).toString('base64url');
	const child = spawn(process.execPath, [SUPERVISOR_PATH, supervisorConfig], {
		detached: process.platform !== 'win32',
		env: {
			...process.env,
			...options.env,
			DB_PATH: databasePath,
			PORT: String(options.port),
			SKIP_HEAVY_SETUP: 'true'
		},
		stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
		windowsHide: true
	});

	activeServers.add(child);
	installShutdownHooks();

	return {
		process: child,
		databasePath,
		stop: async () => {
			await stopProcessTree(child);
			activeServers.delete(child);
			if (activeServers.size === 0) removeShutdownHooks();
		}
	};
}
