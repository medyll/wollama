<script lang="ts">
	import Icon from '@iconify/svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { t } from '$lib/state/i18n.svelte';

	let { message, onRegenerate } = $props();
	let isCopied = $state(false);
	let rating = $state<'good' | 'bad' | null>(null);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(message.content);
			isCopied = true;
			toast.success(t('ui.copied_to_clipboard') || 'Copied to clipboard');
			setTimeout(() => (isCopied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
			toast.error('Failed to copy');
		}
	}

	function handleRate(value: 'good' | 'bad') {
		if (rating === value) {
			rating = null;
		} else {
			rating = value;
		}
		// TODO: Persist rating
	}
</script>

<div class="mt-2 flex items-center gap-2">
	<!-- Section: Rating -->
	<div class="rating-actions">
		<button
			class="btn-icon btn-xs"
			data-rating={rating === 'good' ? 'good' : undefined}
			onclick={() => handleRate('good')}
			title="Good response"
			aria-label="Rate good"
		>
			<Icon icon={rating === 'good' ? 'lucide:thumbs-up' : 'lucide:thumbs-up'} class="h-4 w-4" />
		</button>
		<button
			class="btn-icon btn-xs"
			data-rating={rating === 'bad' ? 'bad' : undefined}
			onclick={() => handleRate('bad')}
			title="Bad response"
			aria-label="Rate bad"
		>
			<Icon icon={rating === 'bad' ? 'lucide:thumbs-down' : 'lucide:thumbs-down'} class="h-4 w-4" />
		</button>
	</div>

	<div class="divider divider-horizontal mx-0"></div>

	<!-- Section: Copy -->
	<button class="btn-icon btn-xs" onclick={copyToClipboard} title="Copy" aria-label="Copy to clipboard">
		{#if isCopied}
			<Icon icon="fluent:checkmark-24-regular" class="action-success h-4 w-4" />
		{:else}
			<Icon icon="fluent:copy-24-regular" class="h-4 w-4" />
		{/if}
	</button>

	<!-- Section: Reload (only if onRegenerate is provided) -->
	{#if onRegenerate}
		<button
			class="btn-icon btn-xs"
			onclick={onRegenerate}
			title="Regenerate"
			aria-label="Regenerate response"
		>
			<Icon icon="fluent:arrow-clockwise-24-regular" class="h-4 w-4" />
		</button>
	{/if}

	<!-- Section: Share -->
	<button class="btn-icon btn-xs" title="Share" aria-label="Share">
		<Icon icon="fluent:share-24-regular" class="h-4 w-4" />
	</button>
</div>

<style>
	@layer components {
		.rating-actions {
			display: flex;
			gap: var(--gap-sm);
		}

		button[data-rating='good'],
		:global(.action-success) {
			color: var(--color-success);
		}

		button[data-rating='bad'] {
			color: var(--color-critical);
		}
	}
</style>
