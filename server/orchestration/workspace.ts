import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

function normalizeForCompare(p: string): string {
	// Windows paths are case-insensitive.
	return process.platform === 'win32' ? p.toLowerCase() : p;
}

/**
 * Resolves `input` to its real, symlink/junction-free absolute path. Returns `null`
 * when the path doesn't exist or can't be resolved — fail closed, an unresolvable
 * path is never treated as allowed.
 *
 * This is the mechanism that defeats a Windows junction planted *inside* an allowed
 * root that points *outside* it: `realpathSync` follows the junction to its actual
 * target, and that target then won't match any allowlist root's own realpath.
 */
export function resolveRealPath(input: string): string | null {
	try {
		return fs.realpathSync(input);
	} catch {
		return null;
	}
}

/**
 * The single point of truth for "is this workspace path allowed" — called from
 * tool-executor.ts (generic) and acp-team.backend.ts (before starting a run). See
 * docs/architecture/mcp-client-acp-team-investigation.md and the M6 section of the
 * implementation plan.
 */
export function isWorkspaceAllowed(workspace: string, allowlist: string[] = config.mcp.workspaceAllowlist): boolean {
	if (!workspace || allowlist.length === 0) return false;

	const resolvedTarget = resolveRealPath(workspace);
	if (!resolvedTarget) return false;
	const target = normalizeForCompare(resolvedTarget);

	return allowlist.some((root) => {
		const resolvedRoot = resolveRealPath(root);
		if (!resolvedRoot) return false;
		const r = normalizeForCompare(resolvedRoot);
		return target === r || target.startsWith(r + path.sep);
	});
}

/** Resolves and validates a workspace path in one call, for callers that just need a
 *  yes/no plus the canonical resolved path to pass onward (e.g. as `cwd`). */
export function resolveWorkspace(workspace: string, allowlist: string[] = config.mcp.workspaceAllowlist): string | null {
	if (!isWorkspaceAllowed(workspace, allowlist)) return null;
	return resolveRealPath(workspace);
}
