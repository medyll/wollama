import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { BackendManager } from './backend-manager.js';

class FakeProcess extends EventEmitter {
	killed = false;

	kill() {
		this.killed = true;
		this.emit('exit', 0);
	}
}

const healthyResponse = {
	ok: true,
	json: async () => ({ service: 'wollama', status: 'ok' })
};
const isolatedTestUrl = 'http://127.0.0.1:55231';

test('reuses an already running Wollama backend', async () => {
	let starts = 0;
	const manager = new BackendManager({
		url: isolatedTestUrl,
		fetchImpl: async () => healthyResponse,
		startProcess: () => {
			starts += 1;
			return new FakeProcess();
		}
	});

	const status = await manager.ensureStarted();

	assert.equal(status.status, 'running');
	assert.equal(status.managed, false);
	assert.equal(starts, 0);
});

test('starts the packaged backend and waits for readiness', async () => {
	let probes = 0;
	const child = new FakeProcess();
	const manager = new BackendManager({
		url: isolatedTestUrl,
		fetchImpl: async () => {
			probes += 1;
			if (probes < 3) throw new Error('not ready');
			return healthyResponse;
		},
		startProcess: () => child,
		startTimeoutMs: 100,
		pollIntervalMs: 1
	});

	const status = await manager.ensureStarted();

	assert.equal(status.status, 'running');
	assert.equal(status.managed, true);
	assert.equal(child.killed, false);
});

test('reports a recoverable failure when the backend never becomes ready', async () => {
	const child = new FakeProcess();
	const manager = new BackendManager({
		url: isolatedTestUrl,
		fetchImpl: async () => {
			throw new Error('offline');
		},
		startProcess: () => child,
		startTimeoutMs: 5,
		pollIntervalMs: 1,
		logger: { error() {} }
	});

	await assert.rejects(manager.ensureStarted(), /did not become ready/);
	assert.equal(manager.getStatus().status, 'failed');
	assert.equal(child.killed, true);
});

test('waits for the managed process to stop before restarting it', async () => {
	let healthy = false;
	let starts = 0;
	const children = [];
	const manager = new BackendManager({
		url: isolatedTestUrl,
		fetchImpl: async () => {
			if (!healthy) throw new Error('offline');
			return healthyResponse;
		},
		startProcess: () => {
			starts += 1;
			const child = new FakeProcess();
			children.push(child);
			healthy = true;
			return child;
		},
		startTimeoutMs: 100,
		pollIntervalMs: 1
	});

	await manager.ensureStarted();
	healthy = false;
	await manager.restart();

	assert.equal(starts, 2);
	assert.equal(children[0].killed, true);
	assert.equal(manager.getStatus().status, 'running');
});
