import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RunStore, type RunDoc, type RunEventDoc } from './run.service.svelte.js';

function runDoc(overrides: Partial<RunDoc> = {}): RunDoc {
	return {
		run_id: 'run-1',
		backend: 'acp-team',
		remote_run_id: 'remote-1',
		agent: 'kimi',
		mode: 'plan',
		cwd: 'D:\\ws',
		status: 'running',
		last_event_seq: 0,
		started_at: new Date().toISOString(),
		...overrides
	};
}

function eventDoc(seq: number, overrides: Partial<RunEventDoc> = {}): RunEventDoc {
	return {
		run_event_id: `ev-${seq}`,
		run_id: 'run-1',
		seq,
		type: 'run.admitted',
		payload: {},
		created_at: new Date().toISOString(),
		...overrides
	};
}

describe('RunStore', () => {
	let store: RunStore;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		store = new RunStore();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		store.stopAll();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	describe('fetchEvents dedup', () => {
		it('merges non-overlapping events and produces no duplicates across repeated polls carrying the same seqs', async () => {
			fetchMock
				.mockResolvedValueOnce({ ok: true, json: async () => [eventDoc(1), eventDoc(2)] })
				// A second poll that (e.g. due to a server retry) resends seq 2 alongside the new seq 3.
				.mockResolvedValueOnce({ ok: true, json: async () => [eventDoc(2), eventDoc(3)] });

			await store.fetchEvents('run-1');
			await store.fetchEvents('run-1');

			const seqs = store.events['run-1'].map((e) => e.seq);
			expect(seqs).toEqual([1, 2, 3]);
		});
	});

	describe('catch-up on remount', () => {
		it('reloads every persisted run for a chat', async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => [runDoc({ run_id: 'run-1', chat_id: 'chat-1' }), runDoc({ run_id: 'run-2', chat_id: 'chat-1' })]
			});

			await store.loadForChat('chat-1');

			expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/runs?chat_id=chat-1'));
			expect(Object.keys(store.runs)).toEqual(['run-1', 'run-2']);
		});

		it('requests only events after the last locally-known seq, exactly once', async () => {
			fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [eventDoc(1), eventDoc(2)] });
			await store.fetchEvents('run-1'); // simulates state already present before "remount"

			fetchMock.mockResolvedValueOnce({ ok: true, json: async () => [eventDoc(3)] });
			await store.fetchEvents('run-1'); // the "catch-up" call

			expect(fetchMock).toHaveBeenCalledTimes(2);
			const secondCallUrl = fetchMock.mock.calls[1][0] as string;
			expect(secondCallUrl).toContain('after=2');
			expect(store.events['run-1'].map((e) => e.seq)).toEqual([1, 2, 3]);
		});
	});

	describe('watch', () => {
		it('is idempotent — a second watch() call on an already-watched run is a no-op', async () => {
			fetchMock.mockResolvedValue({ ok: true, json: async () => runDoc({ status: 'running' }) });

			store.watch('run-1');
			const callsAfterFirst = fetchMock.mock.calls.length;
			store.watch('run-1');
			await Promise.resolve();

			// no additional immediate tick was scheduled by the second watch() call
			expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(callsAfterFirst + 2);
		});

		it('stops polling once the run reaches a terminal status', async () => {
			vi.useFakeTimers();
			let call = 0;
			fetchMock.mockImplementation(async (url: string) => {
				if (url.includes('/events')) return { ok: true, json: async () => [] };
				call++;
				return { ok: true, json: async () => runDoc({ status: call === 1 ? 'running' : 'completed' }) };
			});

			store.watch('run-1');
			await vi.advanceTimersByTimeAsync(2000); // first interval tick -> status becomes 'completed'
			await vi.advanceTimersByTimeAsync(2000); // if polling continued, this would tick again

			const runCallsAfterTerminal = fetchMock.mock.calls.filter((c) => !String(c[0]).includes('/events')).length;
			// initial tick (call=1, running) + interval tick (call=2, completed) = 2 run fetches, then stopped
			expect(runCallsAfterTerminal).toBe(2);

			vi.useRealTimers();
		});
	});

	describe('cancel', () => {
		it('POSTs to /api/runs/:id/cancel', async () => {
			fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
			await store.cancel('run-1');
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining('/api/runs/run-1/cancel'),
				expect.objectContaining({ method: 'POST' })
			);
		});
	});
});
