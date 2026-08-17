<script lang="ts">
	import { parseMarkdown } from '$lib/utils/markdown';
	import { parseThinking } from '$lib/utils/thinking';

	let { content } = $props();

	let parsed = $derived(parseThinking(content));
</script>

<div class="flex flex-col gap-2">
	{#if parsed.pre}
		<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
			{@html parseMarkdown(parsed.pre)}
		</div>
	{/if}

	{#if parsed.isThinking}
		<p class="thinking-status" role="status">Thinking…</p>
	{/if}

	{#if parsed.response}
		<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
			{@html parseMarkdown(parsed.response)}
		</div>
	{:else if !parsed.thinking && !parsed.response && !parsed.pre}
		<!-- Empty state -->
	{/if}
</div>

<style>
	@layer components {
		.thinking-status {
			margin: 0;
			color: var(--color-text-muted);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
		}
	}
</style>
