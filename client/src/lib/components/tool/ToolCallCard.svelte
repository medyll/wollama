<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { userState } from '$lib/state/user.svelte';

	interface ToolCallDoc {
		tool_call_id: string;
		tool_id?: string;
		tool_name?: string;
		server_id?: string;
		risk?: 'read' | 'write' | 'execute' | 'external';
		status: 'pending' | 'running' | 'done' | 'error';
		input?: Record<string, unknown>;
		output?: Record<string, unknown>;
		error?: string;
		duration_ms?: number;
		started_at?: string;
		finished_at?: string;
	}

	// Rendered from the persisted tool_calls row (GET /api/mcp/tool-calls/:id), not from
	// the live NDJSON stream — the stream is transient, this is the audit record.
	let { toolCallId }: { toolCallId: string } = $props();

	let doc = $state<ToolCallDoc | null>(null);
	let loadError = $state(false);
	let poller: ReturnType<typeof setInterval> | undefined;

	async function fetchDoc() {
		const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
		try {
			const res = await fetch(`${serverUrl}/api/mcp/tool-calls/${encodeURIComponent(toolCallId)}`);
			if (!res.ok) {
				loadError = true;
				return;
			}
			doc = await res.json();
			if (doc && (doc.status === 'done' || doc.status === 'error') && poller) {
				clearInterval(poller);
				poller = undefined;
			}
		} catch {
			loadError = true;
		}
	}

	onMount(() => {
		void fetchDoc();
		poller = setInterval(() => void fetchDoc(), 2000);
	});

	onDestroy(() => {
		if (poller) clearInterval(poller);
	});
</script>

<tool-call-card data-status={doc?.status ?? 'pending'}>
	{#if doc}
		<div class="flex items-start justify-between">
			<div>
				<div class="font-semibold">{doc.tool_name ?? doc.tool_id ?? 'tool'}</div>
				<div class="text-muted text-sm">
					{doc.server_id ?? ''}
					{#if doc.risk}<span class="risk-badge" data-risk={doc.risk}>{doc.risk}</span>{/if}
				</div>
			</div>
			<div class="text-muted text-sm" data-testid="tool-call-status">
				{doc.status}
				{#if doc.duration_ms}&middot; {doc.duration_ms}ms{/if}
			</div>
		</div>

		{#if doc.error}
			<p class="tool-call-error">{doc.error}</p>
		{/if}

		<div class="mt-2 text-sm">
			{#if doc.input}
				<details>
					<summary class="cursor-pointer">Input</summary>
					<pre class="mt-2 text-xs">{JSON.stringify(doc.input, null, 2)}</pre>
				</details>
			{/if}
			{#if doc.output}
				<details class="mt-2">
					<summary class="cursor-pointer">Output</summary>
					<pre class="mt-2 text-xs">{JSON.stringify(doc.output, null, 2)}</pre>
				</details>
			{/if}
		</div>
	{:else if loadError}
		<p class="tool-call-error">Failed to load tool call {toolCallId}.</p>
	{:else}
		<p class="text-muted text-sm">Loading tool call…</p>
	{/if}
</tool-call-card>

<style>
	@layer components {
		tool-call-card {
			display: block;
			padding: var(--pad-md);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
		}

		tool-call-card[data-status='error'] {
			border-color: var(--color-critical);
		}

		tool-call-card[data-status='done'] {
			border-color: var(--color-success);
		}

		.tool-call-error {
			color: var(--color-critical);
			font-size: var(--text-sm);
			margin-top: var(--pad-xs, 0.25rem);
		}

		.risk-badge {
			margin-left: var(--pad-xs, 0.25rem);
			padding: 0 var(--pad-xs, 0.25rem);
			border-radius: var(--radius-sm, 0.25rem);
			border: var(--border-width) solid var(--color-border);
			font-size: var(--text-xs);
			text-transform: uppercase;
		}

		.risk-badge[data-risk='write'],
		.risk-badge[data-risk='execute'] {
			border-color: var(--color-warning);
			color: var(--color-warning);
		}

		.risk-badge[data-risk='external'] {
			border-color: var(--color-info, var(--color-border));
		}
	}
</style>
