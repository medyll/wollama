<script lang="ts">
	import { connectionState } from '$lib/state/connection.svelte';
	import { t } from '$lib/state/i18n.svelte';
	import Icon from '@iconify/svelte';

	let isOffline = $derived(!connectionState.isConnected);
	let isSyncing = $derived(connectionState.isSyncing);
</script>

{#if isOffline || isSyncing}
	<div
		class="bg-warning text-warning-content fixed right-4 bottom-4 flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg"
		role="status"
		aria-live="polite"
	>
		<Icon
			icon={isSyncing ? 'fluent:cloud-sync-20-regular' : 'fluent:cloud-off-20-regular'}
			class={isSyncing ? 'animate-spin' : ''}
		/>
		<span class="text-sm font-medium">
			{#if isSyncing}
				{t('sync.syncing') || 'Syncing...'}
			{:else}
				{t('sync.offline') || 'Offline'}
			{/if}
		</span>
	</div>
{/if}

<style>
</style>
