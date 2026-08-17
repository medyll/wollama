import { describe, expect, it, vi, beforeEach } from 'vitest';

function makeCollection() {
	const store: Record<string, any> = {};
	return {
		store,
		put: vi.fn(async (doc: any) => {
			store[doc._id] = { ...doc };
			return { ok: true };
		}),
		get: vi.fn(async (id: string) => {
			const doc = store[id];
			if (!doc) {
				const e: any = new Error('not found');
				e.status = 404;
				throw e;
			}
			return { ...doc };
		}),
		find: vi.fn(async (query: any) => {
			const selector = query.selector ?? {};
			const docs = Object.values(store).filter((d: any) => {
				if (selector.run_id !== undefined && d.run_id !== selector.run_id) return false;
				if (selector.chat_id !== undefined && d.chat_id !== selector.chat_id) return false;
				if (selector.seq?.$gt !== undefined && !(d.seq > selector.seq.$gt)) return false;
				return true;
			});
			return { docs };
		})
	};
}

const runsDb = makeCollection();
const runEventsDb = makeCollection();

vi.mock('../db/database.js', () => ({
	dbManager: {
		getDb: (name: string) => (name === 'runs' ? runsDb : runEventsDb)
	}
}));

import { runManager, registerRunBackend, unregisterRunBackend } from './run-manager.js';
import type { RunBackend, RunEvent, RunStatus } from './types.js';

function makeFakeBackend(id: string, watchResponses: { status: RunStatus; events: RunEvent[]; lastEvent: number }[]) {
	let call = 0;
	const cancelCalls: string[] = [];
	const backend: RunBackend & { cancelCalls: string[] } = {
		backendId: id,
		cancelCalls,
		async start() {
			return { remote_run_id: 'remote-1' };
		},
		async watch(_remoteRunId, _afterEvent, _waitMs) {
			const resp = watchResponses[Math.min(call, watchResponses.length - 1)];
			call++;
			return resp;
		},
		async cancel(remoteRunId) {
			cancelCalls.push(remoteRunId);
		}
	};
	return backend;
}

beforeEach(() => {
	for (const k of Object.keys(runsDb.store)) delete runsDb.store[k];
	for (const k of Object.keys(runEventsDb.store)) delete runEventsDb.store[k];
	vi.clearAllMocks();
});

describe('runManager (M4)', () => {
	it('lists persisted runs for one chat, newest first', async () => {
		await runsDb.put({ _id: 'run-old', run_id: 'run-old', chat_id: 'chat-1', started_at: '2026-01-01T00:00:00.000Z' });
		await runsDb.put({ _id: 'run-other', run_id: 'run-other', chat_id: 'chat-2', started_at: '2026-03-01T00:00:00.000Z' });
		await runsDb.put({ _id: 'run-new', run_id: 'run-new', chat_id: 'chat-1', started_at: '2026-02-01T00:00:00.000Z' });

		const runs = await runManager.listByChat('chat-1');

		expect(runs.map((run) => run.run_id)).toEqual(['run-new', 'run-old']);
	});

	it('drives a run through queued -> running -> completed, persisting all events exactly once', async () => {
		const backend = makeFakeBackend('fake-happy', [
			{ status: 'queued', events: [{ seq: 1, type: 'run.waiting', payload: {} }], lastEvent: 1 },
			{
				status: 'running',
				events: [
					{ seq: 2, type: 'run.admitted', payload: {} },
					{ seq: 3, type: 'assistant.delta', payload: { text: 'hi' } }
				],
				lastEvent: 3
			},
			{ status: 'completed', events: [{ seq: 4, type: 'run.completed', payload: {} }], lastEvent: 4 }
		]);
		registerRunBackend(backend);

		const { run_id, done } = await runManager.start({ backendId: 'fake-happy', agent: 'kimi', prompt: 'hi', cwd: 'D:\\ws' });
		await done;

		const run = await runManager.get(run_id);
		expect(run?.status).toBe('completed');
		expect(run?.last_event_seq).toBe(4);
		expect(run?.remote_run_id).toBe('remote-1');
		expect(run?.finished_at).toBeTruthy();

		const events = await runManager.events(run_id, 0);
		expect(events.map((e) => e.seq)).toEqual([1, 2, 3, 4]);
		expect(new Set(events.map((e) => e.run_event_id)).size).toBe(4); // no duplicates

		unregisterRunBackend('fake-happy');
	});

	it('emits exactly one run_gap event on a seq jump, and keeps advancing', async () => {
		const backend = makeFakeBackend('fake-gap', [
			// seq 1,2 first — no gap yet, prevSeq starts at 0.
			{
				status: 'running',
				events: [
					{ seq: 1, type: 'run.admitted', payload: {} },
					{ seq: 2, type: 'assistant.delta', payload: {} }
				],
				lastEvent: 2
			},
			// jump straight to seq 9 — this is the gap under test (2 -> 9).
			{ status: 'completed', events: [{ seq: 9, type: 'run.completed', payload: {} }], lastEvent: 9 }
		]);
		registerRunBackend(backend);

		const { run_id, done } = await runManager.start({ backendId: 'fake-gap', agent: 'kimi', prompt: 'hi', cwd: 'D:\\ws' });
		await done;

		const run = await runManager.get(run_id);
		expect(run?.status).toBe('completed');
		expect(run?.last_event_seq).toBe(9);

		const events = await runManager.events(run_id, 0);
		const gaps = events.filter((e) => e.type === 'run_gap');
		expect(gaps).toHaveLength(1);
		expect(gaps[0]).toMatchObject({ payload: { from_seq: 2, to_seq: 9 } });

		unregisterRunBackend('fake-gap');
	});

	it('cancel() drives the run through cancelling -> cancelled and calls backend.cancel', async () => {
		let watchCallCount = 0;
		const cancelCalls: string[] = [];
		const backend: RunBackend = {
			backendId: 'fake-cancel',
			async start() {
				return { remote_run_id: 'remote-cancel' };
			},
			async watch() {
				watchCallCount++;
				if (watchCallCount === 1) {
					return {
						status: 'running' as RunStatus,
						events: [{ seq: 1, type: 'run.admitted', payload: {} }],
						lastEvent: 1
					};
				}
				// Once cancel() has been called on the backend, report the terminal state.
				if (cancelCalls.length > 0) {
					return { status: 'cancelled' as RunStatus, events: [], lastEvent: 1 };
				}
				return { status: 'cancelling' as RunStatus, events: [], lastEvent: 1 };
			},
			async cancel(remoteRunId) {
				cancelCalls.push(remoteRunId);
			}
		};
		registerRunBackend(backend);

		const { run_id, done } = await runManager.start({ backendId: 'fake-cancel', agent: 'kimi', prompt: 'hi', cwd: 'D:\\ws' });

		// Request cancellation via the same microtask chain the watch loop runs on —
		// no real timer involved, so this can't race a fast-resolving fake backend.
		await runManager.cancel(run_id);
		await done;

		const run = await runManager.get(run_id);
		expect(run?.status).toBe('cancelled');
		expect(cancelCalls).toEqual(['remote-cancel']);

		unregisterRunBackend('fake-cancel');
	});

	it('startFromToolCall requires ctx.workspace and agent/prompt', async () => {
		const missingWorkspace = await runManager.startFromToolCall({ agent: 'kimi', prompt: 'hi' }, { origin: 'chat' });
		expect(missingWorkspace.ok).toBe(false);
		expect(missingWorkspace.error).toBe('workspace_required');

		const missingFields = await runManager.startFromToolCall({}, { origin: 'chat', workspace: 'D:\\ws' });
		expect(missingFields.ok).toBe(false);
		expect(missingFields.error).toBe('invalid_input');
	});
});
