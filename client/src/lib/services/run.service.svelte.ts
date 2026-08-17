import { userState } from '$lib/state/user.svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

// Note on filename: reactive $state fields require the .svelte.ts extension for the
// Svelte 5 compiler to process runes outside a component — a plain run.service.ts
// cannot use $state. Kept under services/ (not state/) since this module also owns
// the fetch/polling logic, not just reactive fields.

export type RunStatus =
	'queued' | 'running' | 'waiting_input' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted' | 'timed_out';

export interface RunDoc {
	run_id: string;
	backend: string;
	remote_run_id: string;
	chat_id?: string;
	message_id?: string;
	tool_call_id?: string;
	agent: string;
	mode: 'plan' | 'default' | 'auto';
	model?: string;
	cwd: string;
	status: RunStatus;
	last_event_seq: number;
	result?: Record<string, unknown>;
	error?: string;
	started_at: string;
	finished_at?: string;
}

export interface RunEventDoc {
	run_event_id: string;
	run_id: string;
	seq: number;
	type: string;
	payload: unknown;
	created_at: string;
}

const TERMINAL = new SvelteSet<RunStatus>(['completed', 'failed', 'cancelled', 'interrupted', 'timed_out']);
const POLL_MS = 2000;

function serverUrl(): string {
	return userState.preferences.serverUrl.replace(/\/$/, '');
}

/**
 * Client-side view of server-owned runs, kept fresh by REST polling rather than RxDB
 * replication: `runs`/`run_events` are written by the server's dbManager-backed
 * PouchDB instances, which live under plain table names (e.g. `runs`), while RxDB
 * replication pulls from per-user-namespaced databases (`user_{uid}_runs`) via
 * express-pouchdb's generic `/_db/:name` mount — two different physical databases.
 * Until that's bridged, REST is the only channel that actually carries this data to
 * the client, so `/api/runs/:id` and `/api/runs/:id/events` are the source of truth
 * here. This mirrors the same REST-polling pattern already used for tool_calls status
 * (see `src/lib/components/ToolCallMessage.test.ts` / `GET /api/agents/:id/status`).
 */
export class RunStore {
	runs = $state<Record<string, RunDoc>>({});
	events = $state<Record<string, RunEventDoc[]>>({});
	private pollers = new SvelteMap<string, ReturnType<typeof setInterval>>();

	private mergeEvents(runId: string, incoming: RunEventDoc[]): void {
		if (incoming.length === 0) return;
		const existing = this.events[runId] ?? [];
		const seen = new SvelteSet(existing.map((e) => e.seq));
		const merged = [...existing];
		for (const ev of incoming) {
			if (seen.has(ev.seq)) continue;
			merged.push(ev);
			seen.add(ev.seq);
		}
		merged.sort((a, b) => a.seq - b.seq);
		this.events = { ...this.events, [runId]: merged };
	}

	private lastKnownSeq(runId: string): number {
		const list = this.events[runId];
		return list && list.length > 0 ? list[list.length - 1].seq : 0;
	}

	async loadForChat(chatId: string): Promise<RunDoc[]> {
		try {
			const res = await fetch(`${serverUrl()}/api/runs?chat_id=${encodeURIComponent(chatId)}`);
			if (!res.ok) return [];
			const docs = (await res.json()) as RunDoc[];
			const retained = Object.fromEntries(Object.entries(this.runs).filter(([, run]) => run.chat_id !== chatId));
			this.runs = { ...retained, ...Object.fromEntries(docs.map((run) => [run.run_id, run])) };
			return docs;
		} catch (e) {
			console.error('Failed to load runs for chat', chatId, e);
			return [];
		}
	}

	async fetchRun(runId: string): Promise<RunDoc | null> {
		try {
			const res = await fetch(`${serverUrl()}/api/runs/${encodeURIComponent(runId)}`);
			if (!res.ok) return null;
			const doc = (await res.json()) as RunDoc;
			this.runs = { ...this.runs, [runId]: doc };
			return doc;
		} catch (e) {
			console.error('Failed to fetch run', runId, e);
			return null;
		}
	}

	/** Fetches only events after the last one already known locally — the "catch-up"
	 *  call a remount performs. Returns the number of new events merged in. */
	async fetchEvents(runId: string): Promise<number> {
		const after = this.lastKnownSeq(runId);
		try {
			const res = await fetch(`${serverUrl()}/api/runs/${encodeURIComponent(runId)}/events?after=${after}`);
			if (!res.ok) return 0;
			const incoming = (await res.json()) as RunEventDoc[];
			this.mergeEvents(runId, incoming);
			return incoming.length;
		} catch (e) {
			console.error('Failed to fetch run events', runId, e);
			return 0;
		}
	}

	/** Starts polling a run until it reaches a terminal status. Idempotent — calling
	 *  it again for a run_id already being watched (e.g. once from chat.service.ts on
	 *  a live 'tool_result', once from a component's onMount after reload) is a no-op
	 *  on the second call, so both call sites can call it freely. */
	watch(runId: string): void {
		if (this.pollers.has(runId)) return;
		const tick = async () => {
			const run = await this.fetchRun(runId);
			await this.fetchEvents(runId);
			if (run && TERMINAL.has(run.status)) {
				this.stopWatching(runId);
			}
		};
		void tick();
		const handle = setInterval(() => void tick(), POLL_MS);
		this.pollers.set(runId, handle);
	}

	stopWatching(runId: string): void {
		const handle = this.pollers.get(runId);
		if (handle) {
			clearInterval(handle);
			this.pollers.delete(runId);
		}
	}

	stopAll(): void {
		for (const runId of this.pollers.keys()) this.stopWatching(runId);
	}

	async cancel(runId: string): Promise<void> {
		try {
			await fetch(`${serverUrl()}/api/runs/${encodeURIComponent(runId)}/cancel`, { method: 'POST' });
		} catch (e) {
			console.error('Failed to cancel run', runId, e);
		}
	}
}

export const runStore = new RunStore();
