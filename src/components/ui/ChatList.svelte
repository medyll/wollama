<script lang="ts">
	import { MenuList, MenuListItem, ListTitle } from '@medyll/idae-slotui-svelte';
	import { getTimeTitle, groupChatMessages, groupMessages } from '$lib/tools/chatMenuList.svelte.js';
	import ChatMenuItem from '$components/ui/ChatMenuItem.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';
	import { idbqlState } from '$lib/db/dbSchema';
	import { page } from '$app/stores';
	import { dbQuery } from '$lib/db/dbQuery';

	const loadChat = async (chatPassKey: string) => {
		ui.showHideMenu(false);
		engine.goto(`/chat/${chatPassKey}`);
	};

	let chatList = $derived(dbQuery('chat').getAll());
	let groupedMenuList = $state({});

	$effect(() => {
		chatList;
		groupedMenuList = groupMessages(chatList);
	});
</script>

<MenuList style="width:100%" selectorField="code" data={groupedMenuList ?? []}>
	{#snippet children({ item, itemIndex })}
		<ListTitle class="soft-title">
			{$t(getTimeTitle(item?.code))}
		</ListTitle>
		<MenuList tall="mini" style="width:100%;" data={item?.items ?? []}>
			{#snippet children({ item })}
				<MenuListItem selected={item.chatId === $page?.params?.id} data={item}>
					<ChatMenuItem
						id={item.id}
						selected={item.chatPassKey === $page?.params?.id}
						on:click={() => {
							loadChat(item.chatPassKey);
						}}
					/>
				</MenuListItem>
			{/snippet}
		</MenuList>
	{/snippet}
</MenuList>
{#if Object.keys(groupedMenuList)?.length == 0}
	<div class="flex flex-col gap-2 text-center text-neutral-500 dark:text-neutral-400">
		<span class="text-2xl">{$t('ui.noChats')}</span>
	</div>
{/if}
