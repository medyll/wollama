import { execFile, execFileSync, spawn } from 'node:child_process';

const ownerPid = process.ppid;
const config = JSON.parse(Buffer.from(process.argv[2], 'base64url').toString('utf8'));
const server = spawn(config.command, config.args, {
	cwd: config.cwd,
	detached: process.platform !== 'win32',
	env: process.env,
	stdio: ['ignore', 'pipe', 'pipe'],
	windowsHide: true
});

server.stdout?.pipe(process.stdout);
server.stderr?.pipe(process.stderr);

let shuttingDown = false;
let monitor;

function isRunning(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

function stopServerSync() {
	if (!server.pid) return;
	try {
		if (process.platform === 'win32') {
			execFileSync('taskkill', ['/PID', String(server.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
		} else {
			process.kill(-server.pid, 'SIGKILL');
		}
	} catch {
		// The server may already have exited.
	}
}

function stopServer() {
	if (!server.pid || server.exitCode !== null || server.signalCode !== null) return Promise.resolve();
	if (process.platform !== 'win32') {
		try {
			process.kill(-server.pid, 'SIGTERM');
		} catch {
			return Promise.resolve();
		}
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		execFile('taskkill', ['/PID', String(server.pid), '/T', '/F'], { windowsHide: true }, () => resolve());
	});
}

async function shutdown(exitCode = 0) {
	if (shuttingDown) return;
	shuttingDown = true;
	clearInterval(monitor);
	await stopServer();
	if (process.connected) process.disconnect();
	process.exit(exitCode);
}

process.on('disconnect', () => void shutdown());
process.on('SIGINT', () => void shutdown(130));
process.on('SIGTERM', () => void shutdown(143));
process.on('exit', stopServerSync);

server.on('exit', (code) => {
	if (!shuttingDown) void shutdown(code ?? 1);
});

server.on('error', (error) => {
	console.error(error);
	void shutdown(1);
});

monitor = setInterval(() => {
	if (!isRunning(ownerPid)) void shutdown();
}, 250);
monitor.unref();
