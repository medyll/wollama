import { config } from '../config.js';
import { isWorkspaceAllowed, resolveRealPath } from '../orchestration/workspace.js';
import type { ExecutionContext, ToolDescriptor, ToolResult } from '../orchestration/types.js';

// Re-exported for existing importers/tests — workspace.ts (M6) is now the single
// point of truth for this check (realpath resolution + junction defenses).
export { isWorkspaceAllowed };

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export type GuardResult = { ok: true; input: Record<string, unknown> } | { ok: false; result: ToolResult };

/**
 * acp-team's delegation tools accept `cwd`, `mode`, and `authorization` in their input
 * schema. None of those may come from the model unchecked:
 *  - `mode` is forced to 'plan' unless `ctx.grantedMode` is set — which tool-executor
 *    only does after permissionService approves a write/execute grant for this exact
 *    call (M6). The model's own `mode` argument is always ignored either way.
 *  - `authorization` is stripped unless `ctx.grantedAuthorization` is set — the token
 *    the user typed into the consent prompt for this one call, sourced from
 *    permission-service's short-lived in-memory hold, never from model/client input.
 *  - `cwd` is always replaced with `ctx.workspace`, resolved via workspace.ts
 *    (realpath + allowlist). acp-team falls back to its own server process's cwd
 *    (Wollama's own source tree) when no cwd is given — that must never happen.
 */
export function guardAcpTeamInput(descriptor: ToolDescriptor, rawInput: unknown, ctx: ExecutionContext): GuardResult {
	const input: Record<string, unknown> = { ...(isRecord(rawInput) ? rawInput : {}) };
	const schemaProps =
		isRecord(descriptor.inputSchema) && isRecord(descriptor.inputSchema.properties) ? descriptor.inputSchema.properties : {};

	if ('authorization' in input) delete input.authorization;
	if (ctx.grantedAuthorization && 'authorization' in schemaProps) {
		input.authorization = ctx.grantedAuthorization;
	}

	if ('mode' in schemaProps) {
		input.mode = ctx.grantedMode ?? 'plan';
	}

	if ('cwd' in schemaProps) {
		if (!ctx.workspace) {
			return {
				ok: false,
				result: {
					ok: false,
					content: `${descriptor.name} requires a workspace, but none was provided for this call.`,
					error: 'workspace_required'
				}
			};
		}
		const resolved = resolveRealPath(ctx.workspace);
		if (!resolved || !isWorkspaceAllowed(ctx.workspace, config.mcp.workspaceAllowlist)) {
			return {
				ok: false,
				result: {
					ok: false,
					content: `Workspace "${ctx.workspace}" is not on the allowed list for ${descriptor.name}.`,
					error: 'workspace_denied'
				}
			};
		}
		input.cwd = resolved;
	}

	return { ok: true, input };
}
