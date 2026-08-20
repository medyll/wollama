import { access, lstat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { TEST_PROFILE_PREFIX } from './test-runtime.js';

const executableArgument = process.argv[2];

if (!executableArgument) {
	throw new Error('Usage: npm run smoke:electron -- <absolute-path-to-packaged-executable>');
}

const executablePath = path.resolve(executableArgument);
await access(executablePath);

const temporaryRoot = path.resolve(os.tmpdir());
const profileDirectory = await mkdtemp(path.join(temporaryRoot, TEST_PROFILE_PREFIX));

async function reserveDisposablePort() {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const serverPort = await new Promise((resolve, reject) => {
			const server = net.createServer();
			server.once('error', reject);
			server.listen(0, '127.0.0.1', () => {
				const address = server.address();
				if (!address || typeof address === 'string') {
					server.close();
					reject(new Error('Could not reserve an isolated test port.'));
					return;
				}

				server.close((error) => (error ? reject(error) : resolve(address.port)));
			});
		});

		if (serverPort !== 3000 && serverPort !== 3210) return serverPort;
	}

	throw new Error('Could not reserve a port distinct from Wollama development and production.');
}

async function waitForHealth(serverPort) {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`http://127.0.0.1:${serverPort}/api/health`);
			const body = response.ok ? await response.json() : null;
			if (body?.service === 'wollama' && body?.status === 'ok') return body;
		} catch {
			// The disposable backend is still starting.
		}

		await new Promise((resolve) => setTimeout(resolve, 250));
	}

	throw new Error('The packaged backend did not become healthy inside its isolated test profile.');
}

async function removeDisposableProfile() {
	const relativeProfilePath = path.relative(temporaryRoot, profileDirectory);
	const profileStat = await lstat(profileDirectory).catch(() => null);
	if (
		!profileStat ||
		profileStat.isSymbolicLink() ||
		!profileStat.isDirectory() ||
		!relativeProfilePath ||
		relativeProfilePath.startsWith('..') ||
		path.isAbsolute(relativeProfilePath) ||
		!path.basename(profileDirectory).startsWith(TEST_PROFILE_PREFIX)
	) {
		throw new Error('Refusing to remove a path that is not the disposable packaged-test profile.');
	}

	await rm(profileDirectory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

let child;
let stderr = '';

try {
	const serverPort = await reserveDisposablePort();
	child = spawn(executablePath, [], {
		env: {
			...process.env,
			WOLLAMA_TEST_MODE: '1',
			WOLLAMA_TEST_PROFILE_DIR: profileDirectory,
			WOLLAMA_TEST_SERVER_PORT: String(serverPort)
		},
		stdio: ['ignore', 'pipe', 'pipe'],
		windowsHide: true
	});
	child.stderr.on('data', (chunk) => {
		stderr += chunk.toString();
	});

	const childFailure = new Promise((_, reject) => {
		child.once('error', reject);
		child.once('exit', (code, signal) => reject(new Error(`Packaged application exited early (${code ?? signal}).`)));
	});
	const health = await Promise.race([waitForHealth(serverPort), childFailure]);
	console.log(`Packaged backend healthy on isolated port ${serverPort}: ${health.status}`);
} catch (error) {
	if (stderr) console.error(stderr.trim());
	throw error;
} finally {
	if (child?.exitCode === null && child.signalCode === null) {
		child.kill();
		await once(child, 'exit');
	}
	await removeDisposableProfile();
}
