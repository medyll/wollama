<script lang="ts">
	import { getTimeTitle, chatMenuList } from '$lib/tools/chatMenuList.js';
	import ChatButton from '$components/chat/input/ChatButton.svelte';
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

<div class="flex-v h-full w-full gap-2 p-3">
	<div class="flex-align-middle gap-2 py-2 relative">
		<div class="flex-align-middle flex-1 gap-2">
			<img
				alt="logo"
				class="iconify"
				width="24"
				src="/assets/svg/lama.svg"
				style="transform: scaleX(-1);"
			/>
			<div class="font-semibold text-xl">wOollama !</div>
			<div
				class="hidden md:block absolute border theme-border theme-bg rounded-full gap-2 p-2 right-0"
			>
				
				<button title={$t('ui.newChat')} on:click={ createChat} class="  iconButton">
					<Icon icon="mdi:chat-plus-outline" class="lg" />
				</button><!-- <a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a>
		<br /> -->
			</div>
		</div>
	</div>
	<input type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
	<hr class="ml-auto w-24" />
	<ChatList />
</div>

<style lang="postcss">
	.chatZone {
		@apply flex flex-col gap-4;
		@apply border rounded-lg p-2 py-4;
		@apply border-neutral-600/10;
		@apply bg-neutral-200/30 dark:bg-slate-600/30;
		@apply shadow shadow-gray-400/70 dark:shadow-black/80;
		@apply backdrop-opacity-90 backdrop-blur-3xl;
	}
</style>
