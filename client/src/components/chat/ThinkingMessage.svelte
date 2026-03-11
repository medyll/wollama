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
		<div class="collapse-arrow bg-base-200/50 border-base-300/50 collapse overflow-hidden rounded-xl border">
			<input type="checkbox" bind:checked={isOpen} />
			<div class="collapse-title flex min-h-0 items-center gap-2 py-2 text-xs font-medium opacity-70">
				<Icon
					icon="fluent:brain-circuit-24-regular"
					class="h-4 w-4 {parsed.isThinking ? 'text-primary animate-pulse' : ''}"
				/>
				<span>{parsed.isThinking ? 'Thinking...' : 'Thought Process'}</span>
			</div>
			<div class="collapse-content border-base-300/30 bg-base-200/30 border-t text-sm opacity-80">
				<div class="prose prose-sm dark:prose-invert max-w-none py-2 leading-relaxed italic">
					{@html parseMarkdown(parsed.thinking)}
				</div>
			</div>
		</div>
	{/if}

	{#if parsed.response}
		<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
			{@html parseMarkdown(parsed.response)}
		</div>
	{:else if !parsed.thinking && !parsed.response && !parsed.pre}
		<!-- Empty state -->
	{/if}
</div>
