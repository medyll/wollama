<script lang="ts">
	import { ListTitle, MenuList, MenuListItem } from '@medyll/idae-slotui-svelte';
	import { getPeriodGroup } from '$lib/tools/chatMenuList.svelte.js';
	import ChatMenuItem from '$components/ui/ChatMenuItem.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';
	import { page } from '$app/state';
	import { qoolie } from '$lib/db/dbQuery';

	const loadChat = async (chatPassKey: string) => {
		ui.showHideMenu(false);
		engine.goto(`/chat/${chatPassKey}`);
	};

	let groupedMenuList = $derived(
		qoolie('chat')
			.getAll()
			?.groupBy?.((item) => {
				/*console.log(item)*/
				return {
					code:  getPeriodGroup(item.created_at),
					items: item.items,
					title: getPeriodGroup(item.created_at)
				};
			}, true)
	);
</script>

<MenuList data={Object.values(groupedMenuList ?? {}) ?? []} selectorField="code" style="width:100%">
	{#snippet children({ item, itemIndex })}
		<ListTitle class="soft-title">
			{item?.code}
			<!--{$t(getTimeTitle(item?.code))}-->
		</ListTitle>
		<MenuList tall="mini" style="width:100%;" data={item?.data ?? []}>
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
{#if Object.values(groupedMenuList ?? {})?.length == 0}
	<div class="flex flex-col gap-2 text-center text-neutral-500 dark:text-neutral-400">
		<span class="text-2xl">{$t('ui.noChats')}</span>
	</div>
{/if}
