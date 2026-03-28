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
		<div class="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg border border-error bg-base-200 p-6 text-center">
			<div class="text-error text-4xl">
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
			<p class="text-base-content/70 text-sm">{errorMessage}</p>
			<button class="btn btn-primary" onclick={retry}>
				{t('ui.error.retry') || 'Retry'}
			</button>
		</div>
	{/if}
{:else}
	{@render children()}
{/if}
