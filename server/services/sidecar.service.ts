import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { config } from '../config.js';

export class SidecarService {
	private process: ChildProcess | null = null;
	private port: number | null = null;
	private endpoint: string | null = null;
	public isReady: boolean = false;

	async start() {
		this.port = await this.findFreePort();
		this.endpoint = `http://127.0.0.1:${this.port}`;

		const rootDir = path.resolve(process.cwd(), '..'); // Assuming server is running from server/ directory
		const packagesDir = path.join(rootDir, 'packages');
		const venvDir = path.join(rootDir, '.venv');

		// Determine Python Executable
		let executablePath = 'python';
		const venvPythonWindows = path.join(venvDir, 'Scripts', 'python.exe');
		const venvPythonUnix = path.join(venvDir, 'bin', 'python');

		if (process.platform === 'win32' && fs.existsSync(venvPythonWindows)) {
			executablePath = venvPythonWindows;
		} else if (fs.existsSync(venvPythonUnix)) {
			executablePath = venvPythonUnix;
		}

		// Determine Script Path
		// In dev: packages/chatterbox/main.py
		// In prod (pkg): We need to handle where the script is bundled.
		// For now, let's assume dev/standard structure.
		const scriptPath = path.join(packagesDir, 'chatterbox', 'main.py');

		if (!fs.existsSync(scriptPath)) {
			console.error(`[Sidecar] Script not found at: ${scriptPath}`);
			return;
		}

		const args = [scriptPath, '--port', this.port.toString()];

		console.log(`[Sidecar] Starting Chatterbox at port ${this.port}...`);
		console.log(`[Sidecar] Executable: ${executablePath}`);
		console.log(`[Sidecar] Script: ${scriptPath}`);

		this.process = spawn(executablePath, args);

		this.process.stdout?.on('data', (data) => {
			const msg = data.toString();
			console.log(`[Chatterbox]: ${msg.trim()}`);
			if (msg.includes('Application startup complete')) {
				this.isReady = true;
				console.log('[Sidecar] Chatterbox is ready.');
			}
		});

		this.process.stderr?.on('data', (data) => {
			console.error(`[Chatterbox ERR]: ${data.toString().trim()}`);
		});

		this.process.on('close', (code) => {
			console.log(`[Sidecar] Chatterbox exited with code ${code}`);
			this.isReady = false;
			this.process = null;
		});
	}

	stop() {
		if (this.process) {
			console.log('[Sidecar] Stopping Chatterbox...');
			this.process.kill();
			this.process = null;
		}
	}

	async synthesize(text: string, emotionTags: string[], parameters: any): Promise<Buffer> {
		if (!this.isReady || !this.endpoint) {
			throw new Error('Sidecar is not ready');
		}

		try {
			const response = await fetch(`${this.endpoint}/synthesize`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text,
					emotion_tags: emotionTags,
					parameters
				})
			});

			if (!response.ok) {
				throw new Error(`TTS Generation failed: ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			return Buffer.from(arrayBuffer);
		} catch (error) {
			console.error('[Sidecar] Synthesis error:', error);
			throw error;
		}
	}

	private async findFreePort(): Promise<number> {
		return new Promise((resolve, reject) => {
			const server = net.createServer();
			server.unref();
			server.on('error', reject);
			server.listen(0, () => {
				const port = (server.address() as net.AddressInfo).port;
				server.close(() => {
					resolve(port);
				});
			});
		});
	}
}

export const sidecarService = new SidecarService();
