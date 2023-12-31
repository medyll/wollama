<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import StatusBar from '../settings/StatusBar.svelte';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';
	import { dbase } from '$lib/db/dbSchema';
	import { idbQuery } from '$lib/db/dbQuery';
	import { page } from '$app/stores';

	new Date().getSeconds();

	$: chat = idbQuery.getChat($ui.activeChatId);

	$: showConfigClose = $page.route.id?.includes('/configuration');

	const openCloseConfig = async () => {
		if ($page.route.id?.includes('/configuration')) {
			ui.setActiveChatId();
			engine.goto('/');
		} else {
			engine.goto('/configuration');
		}
	};
</script>

<div class="application-topBar">
	<div class="flex-1 text-center soft-title">
		{#await chat then value}
			{value?.title ?? ''}
		{/await}
	</div>
	<button class="btn" on:click={openCloseConfig}>
		{#if showConfigClose}
			<Icon icon="mdi:close-circle" class="text-blue lg " style="font-size:1.6em;color:red" />
		{/if}
		{$t('settings.configureOllama')}
	</button>
	<StatusBar />
	<button title={$t('ui.userProfile')}>
		<Icon icon="mdi:account-circle-outline" style="font-size:1.6em" />
	</button>
	<button title={$t('ui.settings')} class="borderButton" on:click={() => ui.showHideSettings()}>
		<Icon icon="mdi:cog-outline" style="font-size:1.6em" />
	</button>
</div>
