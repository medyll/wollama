<script lang="ts">
	import { permissionState } from '$lib/state/permissions.svelte.js';

	let { request } = $props<{ request: import('$lib/state/permissions.svelte.js').PermissionRequest }>();

	let scope = $state<'once' | 'session' | 'persistent'>('once');
	let authorization = $state('');
	let busy = $state(false);

	let isWriteLike = $derived(request.risk === 'write' || request.risk === 'execute');
	let isAcpTeam = $derived(request.tool_id.startsWith('mcp:acp-team:'));

	async function respond(decision: 'allow' | 'deny') {
		busy = true;
		await permissionState.respond(request.request_id, decision, scope, {
			workspace: request.workspace,
			toolId: request.tool_id,
			authorization: decision === 'allow' && authorization ? authorization : undefined
		});
		busy = false;
	}
</script>

<permission-prompt data-risk={request.risk} data-testid="permission-prompt">
	<div class="font-semibold">Permission requested</div>
	<div class="text-muted text-sm">
		<strong>{request.tool_id}</strong> &middot; risk: <span class="risk-badge" data-risk={request.risk}>{request.risk}</span>
	</div>
	{#if request.workspace}
		<div class="text-muted text-sm">workspace: {request.workspace}</div>
	{/if}
	{#if request.host}
		<div class="text-muted text-sm">target host: <strong>{request.host}</strong></div>
	{/if}

	<details open class="mt-2">
		<summary class="cursor-pointer">Arguments</summary>
		<pre class="mt-2 text-xs">{JSON.stringify(request.input, null, 2)}</pre>
	</details>

	<div class="mt-2">
		<label class="text-sm" for="scope-{request.request_id}">Remember this decision for</label>
		<select id="scope-{request.request_id}" bind:value={scope} data-testid="permission-scope">
			<option value="once">This call only</option>
			<option value="session">This session</option>
			<option value="persistent">Always (this tool + workspace)</option>
		</select>
	</div>

	{#if isWriteLike && isAcpTeam}
		<div class="mt-2">
			<label class="text-sm" for="auth-{request.request_id}">
				acp-team authorization token (from `acp-team authorize grant`) — required for non-plan modes
			</label>
			<input
				id="auth-{request.request_id}"
				type="password"
				bind:value={authorization}
				placeholder="auth_..."
				data-testid="permission-authorization"
			/>
		</div>
	{/if}

	<div class="mt-2 flex gap-2">
		<button type="button" disabled={busy} onclick={() => respond('deny')} data-testid="permission-deny">Deny</button>
		<button type="button" disabled={busy} onclick={() => respond('allow')} data-testid="permission-allow">Allow</button>
	</div>
</permission-prompt>

<style>
	@layer components {
		permission-prompt {
			display: block;
			padding: var(--pad-md);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-warning);
			border-radius: var(--radius-md);
		}

		.risk-badge {
			padding: 0 var(--pad-xs, 0.25rem);
			border-radius: var(--radius-sm, 0.25rem);
			border: var(--border-width) solid var(--color-border);
			font-size: var(--text-xs);
			text-transform: uppercase;
		}
	}
</style>
