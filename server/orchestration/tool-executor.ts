import { randomUUID } from 'crypto';
import { dbManager } from '../db/database.js';
import { toolCatalog } from './tool-catalog.js';
import { validateToolInput } from './validate.js';
import { guardAcpTeamInput } from '../mcp/acp-team.guard.js';
import { getHttpServerHost } from '../mcp/http-servers.connection.js';
import { permissionService } from './permission-service.js';
import type { ExecutionContext, ToolCallRequest, ToolDescriptor, ToolResult, ToolRisk } from './types.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const OUTPUT_TRUNCATE_BYTES = 8 * 1024;
// Cycle breaker for a call chain crossing multiple MCP gateways/servers (M7) — see
// ExecutionContext.hopCount. Wollama's own call graph never exceeds 1 today.
const MAX_HOPS = 8;

export interface PermissionRequestEvent {
	request_id: string;
	tool_id: string;
	risk: ToolRisk;
	/** the full, unmodified input — the consent prompt shows it in extenso */
	input: unknown;
	workspace?: string;
	/** target host, shown for 'external' MCP-HTTP-server tools so the consent prompt
	 *  says where the request actually goes, not just an opaque tool id */
	host?: string;
}

export interface ExecuteOptions {
	/** Called synchronously the moment a call needs live consent — lets the caller
	 *  (conversation-orchestrator) surface a `permission_request` WollamaEvent to the
	 *  client before awaiting the decision. */
	onPermissionRequest?: (evt: PermissionRequestEvent) => void;
}

function truncate(content: string): string {
	if (content.length <= OUTPUT_TRUNCATE_BYTES) return content;
	return content.slice(0, OUTPUT_TRUNCATE_BYTES) + '\n…(truncated)';
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
	let timer: ReturnType<typeof setTimeout>;
	const timeout = new Promise<never>((_, reject) => {
		timer = setTimeout(() => reject(new Error(`Tool call timed out after ${ms}ms`)), ms);
	});
	try {
		return await Promise.race([p, timeout]);
	} finally {
		clearTimeout(timer!);
	}
}

async function persistStart(descriptor: ToolDescriptor, input: unknown, ctx: ExecutionContext): Promise<string> {
	const tool_call_id = randomUUID();
	const db = dbManager.getDb('tool_calls');
	await db.put({
		_id: tool_call_id,
		tool_call_id,
		...(ctx.message_id ? { message_id: ctx.message_id } : {}),
		status: 'running',
		input,
		tool_id: descriptor.id,
		server_id: descriptor.serverId,
		tool_name: descriptor.wireName,
		chat_id: ctx.chat_id ?? '',
		risk: descriptor.risk,
		origin: ctx.origin,
		started_at: new Date().toISOString()
	});
	return tool_call_id;
}

async function persistEnd(tool_call_id: string, result: ToolResult, durationMs: number): Promise<void> {
	const db = dbManager.getDb('tool_calls');
	try {
		const existing: any = await db.get(tool_call_id);
		await db.put({
			...existing,
			status: result.ok ? 'done' : 'error',
			output: result.data,
			error: result.ok ? undefined : result.error,
			duration_ms: durationMs,
			finished_at: new Date().toISOString()
		});
	} catch {
		// Best-effort audit trail — a persistence failure must not fail the tool call itself.
	}
}

async function executeDescriptor(
	descriptor: ToolDescriptor,
	rawInput: unknown,
	ctx: ExecutionContext,
	opts: ExecuteOptions = {}
): Promise<ToolResult> {
	const hopCount = ctx.hopCount ?? 0;
	if (hopCount >= MAX_HOPS) {
		return {
			ok: false,
			content: `Tool call chain exceeded ${MAX_HOPS} hops — refusing to continue (possible gateway cycle).`,
			error: 'hop_limit_exceeded'
		};
	}

	// Permission gate runs before the acp-team guard so an approved write/execute call
	// can hand the guard ctx.grantedMode / ctx.grantedAuthorization to act on.
	let effectiveCtx: ExecutionContext = { ...ctx, hopCount: hopCount + 1 };
	const decision = await permissionService.check(descriptor, ctx);
	if (decision === 'deny') {
		return { ok: false, content: `Tool ${descriptor.name} is not authorized in this context.`, error: 'denied' };
	}
	if (decision === 'ask') {
		let capturedRequestId = '';
		const finalDecision = await permissionService.requestAndAwait(descriptor, ctx.workspace, (request_id) => {
			capturedRequestId = request_id;
			opts.onPermissionRequest?.({
				request_id,
				tool_id: descriptor.id,
				risk: descriptor.risk,
				input: rawInput,
				workspace: ctx.workspace,
				host: getHttpServerHost(descriptor.serverId)
			});
		});
		const request_id = capturedRequestId;
		if (finalDecision === 'deny') {
			return {
				ok: false,
				content: `Permission for ${descriptor.name} was denied or timed out.`,
				error: 'permission_denied'
			};
		}
		if (descriptor.serverId === 'acp-team' && (descriptor.risk === 'write' || descriptor.risk === 'execute')) {
			const authorization = permissionService.takeAuthorization(request_id);
			effectiveCtx = {
				...effectiveCtx,
				grantedMode: 'default',
				...(authorization ? { grantedAuthorization: authorization } : {})
			};
		}
	} else if (
		decision === 'allow' &&
		descriptor.serverId === 'acp-team' &&
		(descriptor.risk === 'write' || descriptor.risk === 'execute')
	) {
		// An existing persistent grant covers this call — no live consent needed, but
		// acp-team's own token requirement for default/auto modes is a separate concern
		// Wollama does not (and must not) satisfy from a stored grant; see M6 notes.
		effectiveCtx = { ...effectiveCtx, grantedMode: 'default' };
	}

	if (descriptor.serverId === 'acp-team') {
		const guard = guardAcpTeamInput(descriptor, rawInput, effectiveCtx);
		if (!guard.ok) return guard.result;
		rawInput = guard.input;
	}

	const validation = validateToolInput(descriptor.id, descriptor.inputSchema, rawInput ?? {});
	if (!validation.valid) {
		return { ok: false, content: `Invalid input for ${descriptor.name}: ${validation.errors}`, error: validation.errors };
	}

	const runtime = toolCatalog.runtimeFor(descriptor.id);
	if (!runtime) {
		return { ok: false, content: `No runtime registered for ${descriptor.id}`, error: 'no_runtime' };
	}

	const tool_call_id = await persistStart(descriptor, rawInput, effectiveCtx);
	const startedAt = Date.now();
	try {
		const result = await withTimeout(runtime.call(descriptor.id, rawInput, effectiveCtx), DEFAULT_TIMEOUT_MS);
		const truncated: ToolResult = { ...result, content: truncate(result.content), tool_call_id };
		await persistEnd(tool_call_id, result, Date.now() - startedAt);
		return truncated;
	} catch (err: any) {
		const message = err?.message ?? 'Unknown error';
		const failed: ToolResult = { ok: false, content: `Tool error: ${message}`, error: message, tool_call_id };
		await persistEnd(tool_call_id, failed, Date.now() - startedAt);
		return failed;
	}
}

export const toolExecutor = {
	/** Resolves a model-issued tool call (by wire name) and executes it. */
	async execute(call: ToolCallRequest, ctx: ExecutionContext, opts: ExecuteOptions = {}): Promise<ToolResult> {
		const descriptor = await toolCatalog.resolveWireName(call.wireName, ctx);
		if (!descriptor) {
			// Returned to the model, not thrown — models generally recover from this.
			return { ok: false, content: `Unknown tool: ${call.wireName}`, error: `Unknown tool: ${call.wireName}` };
		}
		return executeDescriptor(descriptor, call.args, ctx, opts);
	},

	/** Resolves a tool call by its namespaced id (used by REST routes / agent-runner). */
	async executeById(toolId: string, input: unknown, ctx: ExecutionContext, opts: ExecuteOptions = {}): Promise<ToolResult> {
		const descriptor = await toolCatalog.get(toolId, ctx);
		if (!descriptor) {
			return { ok: false, content: `Unknown tool: ${toolId}`, error: `Unknown tool: ${toolId}` };
		}
		return executeDescriptor(descriptor, input, ctx, opts);
	}
};
