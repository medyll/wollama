import { randomUUID } from 'crypto';
import { dbManager } from '../db/database.js';
import type { ExecutionContext, RunBackend, RunStatus, ToolResult } from './types.js';

const WAIT_MS = 25_000;
const TERMINAL: readonly RunStatus[] = ['completed', 'failed', 'cancelled', 'interrupted', 'timed_out'];

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

export interface StartRunRequest {
	backendId: string;
	agent: string;
	prompt: string;
	cwd: string;
	model?: string;
	chat_id?: string;
	message_id?: string;
	tool_call_id?: string;
	/** Only ever set by startFromToolCall() after permissionService approved a
	 *  write/execute grant for this exact call — defaults to 'plan'. */
	mode?: 'plan' | 'default' | 'auto';
	/** The acp-team token captured from a live consent round trip, forwarded through
	 *  to the backend's own systemCtx for exactly this one start() call. */
	grantedAuthorization?: string;
}

const backends = new Map<string, RunBackend>();
const cancelFlags = new Set<string>();
// Separate from cancelFlags so backend.cancel() fires at most once per run_id even if
// the persisted `status` field races with a backend that independently reports
// 'cancelling' before our own guard would have caught up.
const cancelIssued = new Set<string>();

export function registerRunBackend(backend: RunBackend): void {
	backends.set(backend.backendId, backend);
}

export function unregisterRunBackend(backendId: string): void {
	backends.delete(backendId);
}

async function getRunDoc(run_id: string): Promise<(RunDoc & { _id: string; _rev?: string }) | null> {
	const db = dbManager.getDb('runs');
	try {
		return (await db.get(run_id)) as any;
	} catch (e: any) {
		if (e.status === 404) return null;
		throw e;
	}
}

async function putRun(doc: RunDoc & { _id: string; _rev?: string }): Promise<void> {
	const db = dbManager.getDb('runs');
	await db.put(doc);
}

async function appendEvent(run_id: string, seq: number, type: string, payload: unknown): Promise<void> {
	const db = dbManager.getDb('run_events');
	const run_event_id = randomUUID();
	await db.put({
		_id: run_event_id,
		run_event_id,
		run_id,
		seq,
		type,
		payload,
		created_at: new Date().toISOString()
	});
}

/** Persists one poll's worth of events (gap markers included), then advances
 *  last_event_seq. Persist-first-then-advance so a crash mid-poll can't silently
 *  lose events: the events are already durable even if the cursor update never lands. */
async function persistPollResult(
	run: RunDoc & { _id: string; _rev?: string },
	events: { seq: number; type: string; payload: unknown }[]
): Promise<{ run: RunDoc & { _id: string; _rev?: string }; maxSeq: number }> {
	let prevSeq = run.last_event_seq;
	let maxSeq = prevSeq;

	for (const ev of events) {
		if (ev.seq > prevSeq + 1) {
			await appendEvent(run.run_id, ev.seq, 'run_gap', { from_seq: prevSeq, to_seq: ev.seq });
		}
		await appendEvent(run.run_id, ev.seq, ev.type, ev.payload);
		prevSeq = ev.seq;
		if (ev.seq > maxSeq) maxSeq = ev.seq;
	}

	const updated = await getRunDoc(run.run_id);
	if (!updated) return { run, maxSeq };
	const next = { ...updated, last_event_seq: maxSeq };
	await putRun(next);
	return { run: next, maxSeq };
}

async function watchLoop(run_id: string, backend: RunBackend): Promise<void> {
	try {
		for (;;) {
			let run = await getRunDoc(run_id);
			if (!run) {
				cancelFlags.delete(run_id);
				cancelIssued.delete(run_id);
				return; // deleted locally — nothing left to supervise
			}

			if (cancelFlags.has(run_id) && !cancelIssued.has(run_id)) {
				cancelIssued.add(run_id); // set before awaiting — guarantees at most one call
				try {
					await backend.cancel(run.remote_run_id);
				} catch {
					// best-effort — the next watch() poll will surface the real status
				}
				run = { ...run, status: 'cancelling' };
				await putRun(run);
			}

			let watchResult;
			try {
				watchResult = await backend.watch(run.remote_run_id, run.last_event_seq, WAIT_MS);
			} catch (err: any) {
				const failed = await getRunDoc(run_id);
				if (failed) {
					await putRun({
						...failed,
						status: 'failed',
						error: err?.message ?? 'watch failed',
						finished_at: new Date().toISOString()
					});
				}
				cancelFlags.delete(run_id);
				cancelIssued.delete(run_id);
				return;
			}

			const { run: afterPersist } = await persistPollResult(run, watchResult.events);

			const isTerminal = TERMINAL.includes(watchResult.status);
			const next: RunDoc & { _id: string; _rev?: string } = {
				...afterPersist,
				status: watchResult.status,
				...(isTerminal ? { finished_at: new Date().toISOString() } : {})
			};
			await putRun(next);

			if (isTerminal) {
				cancelFlags.delete(run_id);
				cancelIssued.delete(run_id);
				return;
			}

			// Real backends long-poll for up to WAIT_MS inside watch() (genuine I/O), so
			// this never matters in production. It guards against a misbehaving or
			// mocked backend that resolves watch() instantly with no new events: without
			// a forced yield, an all-microtask loop can starve the event loop's macrotask
			// queue indefinitely (cancel() included) and spin until the process OOMs.
			await new Promise((resolve) => setImmediate(resolve));
		}
	} catch {
		// A truly unexpected error must not crash the process — the run simply stops
		// advancing and stays in its last known status, visible via GET /api/runs/:id.
	}
}

/** Starts a run and kicks off its background watch loop. `done` resolves when the
 *  loop reaches a terminal state — production callers ignore it; tests await it. */
async function startRun(req: StartRunRequest): Promise<{ run_id: string; done: Promise<void> }> {
	const backend = backends.get(req.backendId);
	if (!backend) throw new Error(`No RunBackend registered for '${req.backendId}'`);

	const mode = req.mode ?? 'plan';
	const run_id = randomUUID();
	const started_at = new Date().toISOString();
	const initial: RunDoc & { _id: string } = {
		_id: run_id,
		run_id,
		backend: req.backendId,
		remote_run_id: '',
		chat_id: req.chat_id,
		message_id: req.message_id,
		tool_call_id: req.tool_call_id,
		agent: req.agent,
		mode,
		model: req.model,
		cwd: req.cwd,
		status: 'queued',
		last_event_seq: 0,
		started_at
	};
	await putRun(initial);

	// grantedMode/grantedAuthorization here are what let acp-team.guard.ts pass a
	// non-'plan' mode and a real token through to the underlying agent_start call —
	// both are only ever set when startFromToolCall() already got a live permission
	// approval for this exact call; otherwise mode stays 'plan' and no token is sent.
	const systemCtx: ExecutionContext = {
		origin: 'system',
		workspace: req.cwd,
		chat_id: req.chat_id,
		message_id: req.message_id,
		...(mode !== 'plan' ? { grantedMode: mode as 'default' | 'auto' } : {}),
		...(req.grantedAuthorization ? { grantedAuthorization: req.grantedAuthorization } : {})
	};

	try {
		const { remote_run_id } = await backend.start(
			{ agent: req.agent, prompt: req.prompt, mode, cwd: req.cwd, model: req.model },
			systemCtx
		);
		const existing = await getRunDoc(run_id);
		if (existing) await putRun({ ...existing, remote_run_id, status: 'running' });
	} catch (err: any) {
		const existing = await getRunDoc(run_id);
		if (existing) {
			await putRun({
				...existing,
				status: 'failed',
				error: err?.message ?? 'start failed',
				finished_at: new Date().toISOString()
			});
		}
		return { run_id, done: Promise.resolve() };
	}

	const done = watchLoop(run_id, backend);
	return { run_id, done };
}

/**
 * The chat-facing entry point: turns a model-issued `agent_start` tool call into a
 * supervised run instead of a single MCP round trip. `ctx.workspace` is the only
 * source of `cwd` — never the model's own arguments.
 *
 * Deliberately ungated (always 'plan' mode, matching M4's shipped behavior): the
 * model can never talk its way into a write/execute run through ordinary
 * conversation. M6's permission gate (ask -> grant -> `mode: 'default'`) applies to
 * `agent_start` only when it's invoked directly through toolExecutor — e.g. via
 * `POST /api/mcp/tools/mcp:acp-team:agent_start/call` — which is a deliberate,
 * explicit, human-initiated action rather than something the model can trigger.
 * Opening write modes from the chat loop itself is a separate, larger UX decision
 * (an explicit opt-in surface in the composer, a slash command, etc.) that this
 * milestone does not attempt.
 */
async function startFromToolCall(
	args: Record<string, unknown>,
	ctx: ExecutionContext,
	opts: { backendId?: string; tool_call_id?: string } = {}
): Promise<ToolResult> {
	const agent = typeof args.agent === 'string' ? args.agent : undefined;
	const prompt = typeof args.prompt === 'string' ? args.prompt : undefined;
	if (!agent || !prompt) {
		return { ok: false, content: 'agent_start requires both `agent` and `prompt`.', error: 'invalid_input' };
	}
	if (!ctx.workspace) {
		return {
			ok: false,
			content: 'agent_start requires a workspace, but none was provided for this call.',
			error: 'workspace_required'
		};
	}

	const backendId = opts.backendId ?? 'acp-team';
	try {
		const { run_id } = await startRun({
			backendId,
			agent,
			prompt,
			cwd: ctx.workspace,
			model: typeof args.model === 'string' ? args.model : undefined,
			chat_id: ctx.chat_id,
			message_id: ctx.message_id,
			tool_call_id: opts.tool_call_id
		});
		return { ok: true, content: `Run ${run_id} started (mode: plan). Watching.`, data: { run_id } };
	} catch (err: any) {
		return { ok: false, content: `Failed to start run: ${err?.message ?? 'unknown error'}`, error: err?.message };
	}
}

export const runManager = {
	start: startRun,
	startFromToolCall,

	async listByChat(chat_id: string): Promise<RunDoc[]> {
		const db = dbManager.getDb('runs');
		const result = await db.find({ selector: { chat_id } });
		const docs = (result.docs as any as RunDoc[]) ?? [];
		return docs.sort((a, b) => b.started_at.localeCompare(a.started_at));
	},

	async cancel(run_id: string): Promise<void> {
		cancelFlags.add(run_id);
	},

	async get(run_id: string): Promise<RunDoc | null> {
		return getRunDoc(run_id);
	},

	async events(run_id: string, afterSeq: number): Promise<RunEventDoc[]> {
		const db = dbManager.getDb('run_events');
		const result = await db.find({ selector: { run_id, seq: { $gt: afterSeq } } });
		const docs = (result.docs as any as RunEventDoc[]) ?? [];
		return docs.sort((a, b) => a.seq - b.seq);
	}
};
