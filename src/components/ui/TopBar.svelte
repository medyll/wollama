<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import StatusBar from '../settings/StatusBar.svelte';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';
	import { dbase } from '$lib/db/dbSchema';
	import { idbQuery } from '$lib/db/dbQuery';

	new Date().getSeconds();

	$: chat = idbQuery.getChat($ui.activeChatId);

	const createChat = async () => {
		ui.setActiveChatId();
		engine.goto('/');
	};
</script>

<div class="sticky  flex-align-middle px-2 gap-2   top-0 mt-0 right-4 left-4 z-50">
	<!-- <div class="hidden md:block absolute border theme-border theme-bg rounded-full gap-2 p-2 mt-72"> 
		<button title={$t('ui.newChat')} on:click={createChat} class="  iconButton">
			<Icon icon="mdi:chat-plus-outline" class="lg"/>
		</button>
	</div> -->
	<div class="flex-1 text-center soft-title relative">
		{#await chat then value}
			{value?.title ?? ''}
		{/await}
	</div>
	<button on:click={()=>{engine.goto('/configuration')}}>configure ollama</button>
	<StatusBar />
	<button
		on:click={() => {
			engine.goto('/signing');
		}}
		title={$t('ui.userProfile')}
	>
		<Icon icon="mdi:account-circle-outline" style="font-size:1.6em" />
	</button>
	<button title={$t('ui.settings')} class="borderButton" on:click={() => ui.showHideSettings()}>
		<Icon icon="mdi:cog-outline" style="font-size:1.6em" />
	</button>
</div>
