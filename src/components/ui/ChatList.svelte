<script lang="ts">
    import { MenuList, MenuListItem, ListTitle } from '@medyll/idae-slotui-svelte';
    import { getTimeTitle, groupChatMessages, groupMessages } from '$lib/tools/chatMenuList.svelte.js';
    import ChatMenuItem from '$components/ui/ChatMenuItem.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import { engine } from '$lib/tools/engine';
    import { idbqlState } from '$lib/db/dbSchema';

    const loadChat = async (id: string) => {
        ui.showHideMenu(false);
        engine.goto(`/chat/${id}`);
    };

    let chatMenuList = $derived(groupMessages(idbqlState.chat.getAll()));
 
</script>

<MenuList style="width:100%" selectorField="code" data={chatMenuList ?? []}>
    {#snippet children({ item, itemIndex })}
        <ListTitle class="soft-title">
            {$t(getTimeTitle(item?.code))}
        </ListTitle>
        <MenuList tall="mini" style="width:100%;" data={item?.items ?? []}>
            {#snippet children({ item })} 
                <MenuListItem selected={item.chatId === $ui.activeChatId} data={item}>
                    <ChatMenuItem
                        chatId={item.chatId}
                        selected={item.chatId === $ui.activeChatId}
                        on:click={() => {
                            loadChat(item.chatId);
                        }} />
                </MenuListItem>
            {/snippet}
        </MenuList>
    {/snippet}
</MenuList>
{#if Object.keys(chatMenuList)?.length == 0}
    <div class="flex flex-col gap-2 text-center text-neutral-500 dark:text-neutral-400">
        <span class="text-2xl">{$t('ui.noChats')}</span>
        <!-- <button title={$t('ui.newChat')} on:click={createChat} class="">
					<Icon icon="mdi:chat-plus-outline" class="md" />
				</button>
				<a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a> -->
    </div>
{/if}
