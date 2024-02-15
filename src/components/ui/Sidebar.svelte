<script lang="ts">
	import Icon from '@iconify/svelte';
	import { t } from '$lib/stores/i18n.js';

	import { ui } from '$lib/stores/ui.js';
	import ChatList from '$components/ui/ChatMenu.svelte';
	import { engine } from '$lib/tools/engine';

	const createChat = async () => {
		ui.setActiveChatId();
		engine.goto('/');
	};
</script>

<div class="application-sideBar">
	<div class="flex-v h-full w-full gap-2 p-3">
		<div class="line-gap-2 py-2 relative">
			<div class="line-gap-2 flex-1">
				<!-- <img alt="logo" class="iconify" width="24" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
				<div class="font-semibold text-xl">wOollama !</div> -->
				<!-- <div class="hidden md:block absolute border theme-border theme-bg rounded-full gap-2 p-2 right-0">
					<button title={$t('ui.newChat')} on:click={createChat} class="aspect-square">
						<Icon icon="mdi:chat-plus-outline" class="lg" />
					</button>
				</div> -->
			</div>
		</div> 
		<input type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
		<hr class="ml-auto w-24" />
		<ChatList />
	</div>
</div>
