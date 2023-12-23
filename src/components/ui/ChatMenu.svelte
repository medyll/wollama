<script lang="ts">
	import { getTimeTitle, chatMenuList } from '$lib/tools/chatMenuList.js';
	import ChatButton from '$components/chat/input/ChatButton.svelte';
	import { t } from '$lib/stores/i18n.js';

	import { ui } from '$lib/stores/ui.js';
	import List from '$components/fragments/List.svelte';
	import { engine } from '$lib/tools/engine';

	const loadChat = async (id: string) => {
		ui.setActiveChatId(id);
		ui.showHideMenu(false);
		engine.goto(`/chat/${id}`);
	};
</script>

<div class="text-right soft-title">{$t('ui.myChats')}</div>
<div class="chatZone">
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
			<div class="text-center text-2xl text-neutral-500 dark:text-neutral-400">
				{$t('ui.noChats')}
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
		@apply border rounded-lg p-2 py-4;
		@apply border-neutral-600/10;
		@apply bg-neutral-200/30 dark:bg-slate-600/30;
		@apply shadow shadow-gray-400/70 dark:shadow-black/80;
		@apply backdrop-opacity-90 backdrop-blur-3xl;
	}
</style>
