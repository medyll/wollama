import { randomUUID } from 'crypto';
import { dbManager } from '../db/database.js';
import { config } from '../config.js';
import type { ExecutionContext, ToolDescriptor, ToolRisk } from './types.js';

export type PermissionDecision = 'allow' | 'deny' | 'ask';
export type PermissionScope = 'once' | 'session' | 'persistent';

export interface GrantDoc {
	grant_id: string;
	user_id: string;
	server_id: string;
	tool_id: string;
	risk: ToolRisk;
	workspace?: string;
	scope: PermissionScope;
	granted_at: string;
	expires_at?: string;
	revoked_at?: string;
}

interface PendingRequest {
	request_id: string;
	tool_id: string;
	server_id: string;
	risk: ToolRisk;
	workspace?: string;
	settle: (decision: 'allow' | 'deny') => void;
	timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 60_000;

const pending = new Map<string, PendingRequest>();
// 'external' risk gets a once-per-session approval, keyed by user+tool — cheaper than
// a persisted grant since it carries no workspace/write implications.
const sessionApproved = new Set<string>();
// The acp-team authorization token supplied alongside an 'allow' decision, held only
// long enough for the in-flight tool-executor call to consume it once.
const heldAuthorization = new Map<string, string>();

function sessionKey(userId: string, toolId: string): string {
	return `${userId}:${toolId}`;
}

function grantKey(workspace: string | undefined): string {
	return workspace ?? '';
}

async function findUsableGrant(toolId: string, workspace: string | undefined, userId: string): Promise<GrantDoc | undefined> {
	const db = dbManager.getDb('mcp_grants');
	const result = await db.find({ selector: { user_id: userId, tool_id: toolId } });
	const docs = (result.docs as any[]) ?? [];
	const now = Date.now();
	return docs.find((g: GrantDoc) => {
		if (g.revoked_at) return false;
		if (g.scope !== 'persistent') return false;
		if (g.expires_at && new Date(g.expires_at).getTime() < now) return false;
		return grantKey(g.workspace) === grantKey(workspace);
	});
}

async function persistGrant(
	descriptor: ToolDescriptor,
	ctx: ExecutionContext,
	scope: PermissionScope,
	ttlMs?: number
): Promise<void> {
	if (!ctx.user_id) return;
	const db = dbManager.getDb('mcp_grants');
	const grant_id = randomUUID();
	const granted_at = new Date().toISOString();
	const doc: GrantDoc & { _id: string } = {
		_id: grant_id,
		grant_id,
		user_id: ctx.user_id,
		server_id: descriptor.serverId,
		tool_id: descriptor.id,
		risk: descriptor.risk,
		workspace: ctx.workspace,
		scope,
		granted_at,
		...(ttlMs ? { expires_at: new Date(Date.now() + ttlMs).toISOString() } : {})
	};
	await db.put(doc);
}

export const permissionService = {
	/**
	 * Decides whether a call may proceed outright ('allow'), must be refused
	 * ('deny'), or needs a live consent round-trip ('ask'). Rules:
	 *  - 'system' origin (Wollama's own supervised follow-ups) always allowed.
	 *  - 'read' risk always allowed — `config.tools.autoApprove` is no longer the
	 *    primary gate for reads (see M1→M6 note in tool-executor.ts), it's advisory.
	 *  - 'external' risk: allowed once approved for this session (per user+tool).
	 *  - 'write' / 'execute': allowed only with a live, non-expired 'persistent'
	 *    grant covering the exact (tool_id, workspace) pair; otherwise 'ask'.
	 */
	async check(descriptor: ToolDescriptor, ctx: ExecutionContext): Promise<PermissionDecision> {
		if (ctx.origin === 'system') return 'allow';
		if (descriptor.risk === 'read') return 'allow';

		if (descriptor.risk === 'external') {
			// `autoApprove` is now just a pre-seeded default trust list (e.g. the
			// built-in web-search/page-fetch tools from M1, kept frictionless) — any
			// other 'external' tool needs a live-or-session consent like normal.
			if (config.tools.autoApprove.includes(descriptor.id)) return 'allow';
			if (!ctx.user_id) return 'ask';
			return sessionApproved.has(sessionKey(ctx.user_id, descriptor.id)) ? 'allow' : 'ask';
		}

		// write | execute
		if (!ctx.user_id) return 'ask';
		const grant = await findUsableGrant(descriptor.id, ctx.workspace, ctx.user_id);
		return grant ? 'allow' : 'ask';
	},

	/**
	 * Registers a pending request and blocks (up to `timeoutMs`) until it's resolved
	 * via resolve() — from either the live WollamaEvent round trip or an out-of-band
	 * POST /api/permissions/:id call — or times out. A timeout always resolves to
	 * 'deny', never a silent allow.
	 *
	 * `onRequested` fires synchronously with the request_id once the pending entry is
	 * registered (Promise executors run synchronously, so this is guaranteed to happen
	 * before the caller can possibly resolve it) — this is what lets
	 * conversation-orchestrator surface a `permission_request` WollamaEvent without a
	 * race against an immediate resolve() call.
	 */
	requestAndAwait(
		descriptor: Pick<ToolDescriptor, 'id' | 'serverId' | 'risk'>,
		workspace: string | undefined,
		onRequested: (request_id: string) => void,
		timeoutMs = DEFAULT_TIMEOUT_MS
	): Promise<'allow' | 'deny'> {
		const request_id = randomUUID();
		const decisionPromise = new Promise<'allow' | 'deny'>((resolve) => {
			const timer = setTimeout(() => {
				pending.delete(request_id);
				resolve('deny');
			}, timeoutMs);
			pending.set(request_id, {
				request_id,
				tool_id: descriptor.id,
				server_id: descriptor.serverId,
				risk: descriptor.risk,
				workspace,
				settle: (decision) => {
					clearTimeout(timer);
					pending.delete(request_id);
					resolve(decision);
				},
				timer
			});
		});
		onRequested(request_id);
		return decisionPromise;
	},

	/** Resolves a pending request. Returns false if the request is unknown (already
	 *  resolved, timed out, or never existed) so callers (the REST route) can 404. */
	async resolve(
		request_id: string,
		decision: 'allow' | 'deny',
		scope: PermissionScope,
		opts: { ctx: ExecutionContext; descriptor?: ToolDescriptor; authorization?: string; ttlMs?: number } = {
			ctx: { origin: 'api' }
		}
	): Promise<boolean> {
		const req = pending.get(request_id);
		if (!req) return false;

		if (decision === 'allow') {
			if (scope === 'session' && opts.ctx.user_id) {
				sessionApproved.add(sessionKey(opts.ctx.user_id, req.tool_id));
			}
			if (scope === 'persistent' && opts.descriptor) {
				await persistGrant(opts.descriptor, { ...opts.ctx, workspace: req.workspace }, scope, opts.ttlMs);
			}
			if (opts.authorization) {
				heldAuthorization.set(request_id, opts.authorization);
			}
		}

		req.settle(decision);
		return true;
	},

	/** Consumes (removes) the authorization token held for a request, if any — called
	 *  exactly once by tool-executor.ts right after awaitDecision() resolves 'allow'. */
	takeAuthorization(request_id: string): string | undefined {
		const token = heldAuthorization.get(request_id);
		heldAuthorization.delete(request_id);
		return token;
	},

	async revoke(grant_id: string): Promise<boolean> {
		const db = dbManager.getDb('mcp_grants');
		try {
			const doc: any = await db.get(grant_id);
			await db.put({ ...doc, revoked_at: new Date().toISOString() });
			return true;
		} catch (e: any) {
			if (e.status === 404) return false;
			throw e;
		}
	},

	/** Test/shutdown hook — clears in-memory state. Not used in production code paths. */
	_resetForTests(): void {
		for (const req of pending.values()) clearTimeout(req.timer);
		pending.clear();
		sessionApproved.clear();
		heldAuthorization.clear();
	}
};
