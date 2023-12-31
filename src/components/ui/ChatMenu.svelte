<script lang="ts">
	import { getTimeTitle, chatMenuList } from '$lib/tools/chatMenuList.js';
	import ChatButton from '$components/chat/input/ChatButton.svelte';
	import { t } from '$lib/stores/i18n.js';

	import { ui } from '$lib/stores/ui.js';
	import List from '$components/fragments/List.svelte';
	import { engine } from '$lib/tools/engine';
	import Icon from '@iconify/svelte';

	const loadChat = async (id: string) => {
		ui.setActiveChatId(id);
		ui.showHideMenu(false);
		engine.goto(`/chat/${id}`);
	};

	const createChat = async () => {
		ui.setActiveChatId();
		engine.goto('/');
	};
</script>

<div class="text-right soft-title">{$t('ui.myChats')}</div>
<div class="chatZone paper">
	<div class="flex-1">
		<List data={$chatMenuList ?? []} let:item>
			<div>
				<div class="font-bold whitespace-nowrap text-ellipsis py-2 soft-title">
					{$t(getTimeTitle(item.code))}
				</div>
				<List data={item.items ?? []} let:item={chat}>
					<ChatButton
						chatId={chat.chatId}
						on:click={() => {
							loadChat(chat.chatId);
						}}
					/>
				</List>
			</div>
		</List>
		{#if Object.keys($chatMenuList)?.length == 0}
			<div class="flex flex-col gap-2 text-center  text-neutral-500 dark:text-neutral-400">
				<span class="text-2xl">{$t('ui.noChats')}</span>
				<!-- <button title={$t('ui.newChat')} on:click={createChat} class="">
					<Icon icon="mdi:chat-plus-outline" class="md" />
				</button>
				<a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a> -->
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	.chatZone {
		max-height: 100%;
		overflow: auto;
	}
	.chatZone {
		@apply flex flex-col gap-4;
		@apply shadow shadow-gray-400/70 dark:shadow-black/80;
	}
</style>
