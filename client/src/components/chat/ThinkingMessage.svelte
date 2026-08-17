<script lang="ts">
	import { parseMarkdown } from '$lib/utils/markdown';
	import { parseThinking } from '$lib/utils/thinking';
	import Icon from '@iconify/svelte';

	let { content } = $props();

	let parsed = $derived(parseThinking(content));

	let isOpen = $state(true);

	// Auto-close when thinking is done
	$effect(() => {
		if (!parsed.isThinking && parsed.thinking) {
			isOpen = false;
		} else if (parsed.isThinking) {
			isOpen = true;
		}
	});
</script>

<div class="flex flex-col gap-2">
	{#if parsed.pre}
		<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
			{@html parseMarkdown(parsed.pre)}
		</div>
	{/if}

	{#if parsed.thinking !== null}
		<details class="thinking-panel" bind:open={isOpen}>
			<summary>
				<Icon
					icon="fluent:brain-circuit-24-regular"
					class="h-4 w-4 {parsed.isThinking ? 'text-primary animate-pulse' : ''}"
				/>
				<span>{parsed.isThinking ? 'Thinking...' : 'Thought Process'}</span>
			</summary>
			<div class="thinking-content">
				<div class="prose prose-sm dark:prose-invert max-w-none py-2 leading-relaxed italic">
					{@html parseMarkdown(parsed.thinking)}
				</div>
			</div>
		</details>
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
		.thinking-panel {
			overflow: hidden;
			background: color-mix(in srgb, var(--color-surface-raised) 50%, transparent);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-lg);
		}

		.thinking-panel summary {
			display: flex;
			align-items: center;
			gap: var(--gap-sm);
			padding: var(--pad-sm) var(--pad-md);
			color: var(--color-text-muted);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
			cursor: pointer;
		}

		.thinking-content {
			padding-inline: var(--pad-md);
			border-top: var(--border-width) solid var(--color-border);
			background: color-mix(in srgb, var(--color-surface-raised) 30%, transparent);
			color: var(--color-text-muted);
			font-size: var(--text-sm);
		}
	}
</style>
