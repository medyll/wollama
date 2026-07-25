<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';

	let { children, fallback }: { children: any; fallback?: any } = $props();
	let hasError = $state(false);
	let errorMessage = $state('');

	// Capture errors from children
	$effect(() => {
		const errorHandler = (event: ErrorEvent) => {
			hasError = true;
			errorMessage = event.message || t('ui.error.unexpected');
			event.preventDefault();
		};

		window.addEventListener('error', errorHandler);

		return () => {
			window.removeEventListener('error', errorHandler);
		};
	});

	function retry() {
		hasError = false;
		errorMessage = '';
		// Force reload of children
		window.location.reload();
	}
</script>

{#if hasError}
	{#if fallback}
		{@render fallback({ error: errorMessage, onRetry: retry })}
	{:else}
		<error-boundary-state>
			<div class="error-icon">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h3 class="text-lg font-semibold">{t('ui.error.something_went_wrong') || 'Something went wrong'}</h3>
			<p>{errorMessage}</p>
			<button class="btn-primary" onclick={retry}>
				{t('ui.error.retry') || 'Retry'}
			</button>
		</error-boundary-state>
	{/if}
{:else}
	{@render children()}
{/if}

<style>
	@layer components {
		error-boundary-state {
			display: flex;
			min-height: 12.5rem;
			align-items: center;
			justify-content: center;
			flex-direction: column;
			gap: var(--gap-lg);
			padding: var(--pad-xl);
			border: var(--border-width) solid var(--color-critical);
			background: var(--color-surface-raised);
			border-radius: var(--radius-lg);
			text-align: center;
		}

		error-boundary-state p {
			margin: 0;
			color: var(--color-text-muted);
			font-size: var(--text-sm);
		}

		.error-icon {
			color: var(--color-critical);
			font-size: var(--text-2xl);
		}
	}
</style>
