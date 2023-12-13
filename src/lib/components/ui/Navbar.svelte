<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { showSettings } from '$lib/stores/settings';
	import { timeRetry } from '$lib/stores/timeRetry';
	import Icon from '@iconify/svelte';
	import StatusBar from './StatusBar.svelte';

	new Date().getSeconds()
</script>

<div class="flex-align-middle p-2 gap-8">
	<div class="flex-1" />
	<StatusBar />
	<button
		on:click={() => {
			goto('/signing');
		}}
		title={$t('ui.userProfile')}
	>
		<Icon icon="mdi:account-circle-outline" style="font-size:1.6em" />
	</button>
	<button title={$t('ui.settings')} class="borderButton" on:click={() => showSettings.set(true)}>
		<Icon icon="mdi:cog-outline" style="font-size:1.6em" />
	</button>
</div>
