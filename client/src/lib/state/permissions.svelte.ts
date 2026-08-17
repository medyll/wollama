import { userState } from '$lib/state/user.svelte';

export interface PermissionRequest {
	request_id: string;
	tool_id: string;
	risk: 'read' | 'write' | 'execute' | 'external';
	input: unknown;
	workspace?: string;
	/** target host for 'external' MCP-HTTP-server tools */
	host?: string;
}

function serverUrl(): string {
	return userState.preferences.serverUrl.replace(/\/$/, '');
}

/** Live queue of pending consent prompts surfaced via the chat NDJSON stream's
 *  `wollama.permission_request` events — see chat.service.ts. */
export class PermissionState {
	pending = $state<PermissionRequest[]>([]);

	push(req: PermissionRequest): void {
		if (this.pending.some((p) => p.request_id === req.request_id)) return;
		this.pending = [...this.pending, req];
	}

	private dismiss(requestId: string): void {
		this.pending = this.pending.filter((p) => p.request_id !== requestId);
	}

	async respond(
		requestId: string,
		decision: 'allow' | 'deny',
		scope: 'once' | 'session' | 'persistent',
		opts: { workspace?: string; toolId?: string; authorization?: string } = {}
	): Promise<boolean> {
		try {
			const res = await fetch(`${serverUrl()}/api/permissions/${encodeURIComponent(requestId)}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					decision,
					scope,
					user_id: userState.uid || 'anonymous',
					workspace: opts.workspace,
					tool_id: opts.toolId,
					authorization: opts.authorization
				})
			});
			this.dismiss(requestId);
			return res.ok;
		} catch (e) {
			console.error('Failed to resolve permission request', requestId, e);
			this.dismiss(requestId);
			return false;
		}
	}
}

export const permissionState = new PermissionState();
