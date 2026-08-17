<script lang="ts">
	interface ToolCallMessage {
		toolName: string;
		toolId: string;
		timestamp: number;
		inputs: Record<string, unknown>;
		outputs?: Record<string, unknown>;
	}

	const { message } = $props();
</script>

<tool-call-message>
	<div class="flex items-start justify-between">
		<div>
			<div class="font-semibold">Tool: {message.toolName}</div>
			<div class="text-muted text-sm">{message.toolId}</div>
		</div>
		<div class="text-muted text-sm">{new Date(message.timestamp).toLocaleString()}</div>
	</div>
	<div class="mt-2 text-sm">
		<details>
			<summary class="cursor-pointer">Inputs</summary>
			<pre class="mt-2 text-xs">{JSON.stringify(message.inputs, null, 2)}</pre>
		</details>
		{#if message.outputs}
			<details class="mt-2">
				<summary class="cursor-pointer">Outputs</summary>
				<pre class="mt-2 text-xs">{JSON.stringify(message.outputs, null, 2)}</pre>
			</details>
		{/if}
	</div>
</tool-call-message>

<style>
	@layer components {
		tool-call-message {
			display: block;
			padding: var(--pad-md);
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-md);
		}
	}
</style>
