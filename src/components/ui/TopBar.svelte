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

<div class="flex-align-middle px-2 gap-2 sticky top-0 mt-0 right-4 left-4 z-50">
	<div class="flex-align-middle gap-2 py-2">
		<a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a>
		<button on:click={createChat} class="borderButton iconButton">
			<Icon icon="mdi:chat-plus-outline" style="font-size:1.6em" />
		</button>
	</div>
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
