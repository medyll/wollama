import assert from 'node:assert/strict';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import test from 'node:test';
import { stopProcessTree } from './e2e-server';

function isRunning(pid: number) {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
}

async function waitForChildPid(parent: ChildProcess): Promise<number> {
	return new Promise((resolve, reject) => {
		let output = '';
		const timeout = setTimeout(() => reject(new Error('Timed out waiting for the descendant PID')), 5_000);

		parent.stdout?.on('data', (chunk: Buffer) => {
			output += chunk.toString();
			const pid = Number.parseInt(output.trim(), 10);
			if (!Number.isNaN(pid)) {
				clearTimeout(timeout);
				resolve(pid);
			}
		});
	});
}

test('stopProcessTree stops a Windows process and its descendant', { skip: process.platform !== 'win32' }, async (context) => {
	const descendantScript = 'setInterval(() => {}, 1000)';
	const parentScript = [
		"const { spawn } = require('node:child_process');",
		`const child = spawn(process.execPath, ['-e', ${JSON.stringify(descendantScript)}], { stdio: 'ignore' });`,
		'console.log(child.pid);',
		'setInterval(() => {}, 1000);'
	].join('');
	const parent = spawn(process.execPath, ['-e', parentScript], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
	const descendantPid = await waitForChildPid(parent);

	context.after(() => {
		for (const pid of [parent.pid, descendantPid]) {
			if (!pid || !isRunning(pid)) continue;
			try {
				execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
			} catch {
				// The process exited while the cleanup command was starting.
			}
		}
	});

	assert.ok(parent.pid);
	assert.equal(isRunning(parent.pid), true);
	assert.equal(isRunning(descendantPid), true);

	await stopProcessTree(parent);

	assert.equal(isRunning(parent.pid), false);
	assert.equal(isRunning(descendantPid), false);
});
