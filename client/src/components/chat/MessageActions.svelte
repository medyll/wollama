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

<message-actions aria-label="Message actions">
	<!-- Section: Rating -->
	<div class="rating-actions">
		<button
			type="button"
			class="btn-icon btn-xs"
			data-rating={rating === 'good' ? 'good' : undefined}
			onclick={() => handleRate('good')}
			title="Good response"
			aria-label="Rate good"
			aria-pressed={rating === 'good'}
		>
			<Icon icon={rating === 'good' ? 'lucide:thumbs-up' : 'lucide:thumbs-up'} class="h-4 w-4" />
		</button>
		<button
			type="button"
			class="btn-icon btn-xs"
			data-rating={rating === 'bad' ? 'bad' : undefined}
			onclick={() => handleRate('bad')}
			title="Bad response"
			aria-label="Rate bad"
			aria-pressed={rating === 'bad'}
		>
			<Icon icon={rating === 'bad' ? 'lucide:thumbs-down' : 'lucide:thumbs-down'} class="h-4 w-4" />
		</button>
	</div>

	<span class="message-action-separator" aria-hidden="true"></span>

	<!-- Section: Copy -->
	<button type="button" class="btn-icon btn-xs" onclick={copyToClipboard} title="Copy" aria-label="Copy to clipboard">
		{#if isCopied}
			<Icon icon="fluent:checkmark-24-regular" class="action-success h-4 w-4" />
		{:else}
			<Icon icon="fluent:copy-24-regular" class="h-4 w-4" />
		{/if}
	</button>

	<!-- Section: Reload (only if onRegenerate is provided) -->
	{#if onRegenerate}
		<button type="button" class="btn-icon btn-xs" onclick={onRegenerate} title="Regenerate" aria-label="Regenerate response">
			<Icon icon="fluent:arrow-clockwise-24-regular" class="h-4 w-4" />
		</button>
	{/if}

	<button type="button" class="btn-icon btn-xs" title="Share (coming soon)" aria-label="Share" disabled>
		<Icon icon="fluent:share-24-regular" class="h-4 w-4" />
	</button>
</message-actions>

<style>
	@layer components {
		message-actions {
			display: flex;
			align-items: center;
			gap: var(--gap-xs);
			margin-block-start: var(--gap-xs);
			color: var(--color-text-muted);
		}

		.rating-actions {
			display: flex;
			gap: var(--gap-xs);
		}

		.message-action-separator {
			width: var(--border-width);
			height: var(--icon-size-sm);
			margin-inline: var(--gap-xs);
			background: var(--wollama-border-subtle);
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
