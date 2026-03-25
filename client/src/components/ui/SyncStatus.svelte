<script lang="ts">
	import { connectionState } from '$lib/state/connection.svelte';
	import Icon from '@iconify/svelte';

	// Reactive derived states
	const isOffline = $derived(!connectionState.isConnected);
	const isSyncing = $derived(connectionState.isSyncing);
</script>

<!-- Sync Status Indicator -->
{#if isOffline}
	<div
		class="alert alert-warning shadow-md"
		role="alert"
		aria-live="polite"
		aria-label="Offline mode - Changes will sync when connected"
	>
		<Icon icon="mdi:wifi-off" class="h-4 w-4" />
		<div>
			<h3 class="font-bold">Offline Mode</h3>
			<div class="text-xs">Changes will sync when you reconnect</div>
		</div>
		{#if isSyncing}
			<span class="loading loading-spinner loading-sm"></span>
		{/if}
	</div>
{:else if isSyncing}
	<div class="alert alert-info shadow-md" role="alert" aria-live="polite" aria-label="Syncing your data">
		<Icon icon="mdi:sync" class="h-4 w-4 animate-spin" />
		<div>
			<h3 class="font-bold">Syncing</h3>
			<div class="text-xs">Synchronizing your data across devices</div>
		</div>
	</div>
{/if}

<style>
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	:global(.animate-spin) {
		animation: spin 2s linear infinite;
	}
</style>
