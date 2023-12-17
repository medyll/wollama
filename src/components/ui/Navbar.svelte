<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import StatusBar from './StatusBar.svelte';
	import { ui } from '$lib/stores/ui';

	new Date().getSeconds();
</script>

<div class="flex-align-middle p-2 gap-8 fixed right-8 z-50">
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
	<button title={$t('ui.settings')} class="borderButton" on:click={() => ui.showHideSettings()}>
		<Icon icon="mdi:cog-outline" style="font-size:1.6em" />
	</button>
</div>
