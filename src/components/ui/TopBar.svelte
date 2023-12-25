<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import StatusBar from '../settings/StatusBar.svelte';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';

	new Date().getSeconds();

	const createChat = async () => {
		ui.setActiveChatId();
		engine.goto('/');
	};
</script>

<div class="theme-bg w-full border-b flex-align-middle sticky t-0 right-0 z-50">
	<div class="flex-align-middle gap-2 py-2">
		<div class="flex-align-middle flex-1 gap-2">
			<img
				alt="logo"
				class="iconify"
				width="24"
				src="/assets/svg/lama.svg"
				style="transform: scaleX(-1);"
			/>
			<div class="font-semibold text-xl">wOollama !</div>
		</div>
		<a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a>
		<button on:click={createChat} class="borderButton iconButton">
			<Icon icon="mdi:chat-plus-outline" style="font-size:1.6em" />
		</button>
	</div>
	<div class="flex-1" />
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
