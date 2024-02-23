<script lang="ts">
    import { List, ListItem } from '@medyll/slot-ui';
    import { getTimeTitle, chatMenuList } from '$lib/tools/chatMenuList.js';
    import ChatMenuItem from '$components/ui/ChatMenuItem.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import { engine } from '$lib/tools/engine'; 

    const loadChat = async (id: string) => {
        ui.setActiveChatId(id);
        ui.showHideMenu(false);
        engine.goto(`/chat/${id}`);
    };

</script>

<List selectorField="code" data={$chatMenuList ?? []} let:item>
    <ListItem class="soft-title" >
    {$t(getTimeTitle(item.data.code))}
    </ListItem>
    <List density="tight"  data={item?.data?.items ?? []} let:item={chat}>
        <ListItem selected={chat.data.chatId === $ui.activeChatId} data={chat.data}>
            <ChatMenuItem  
                chatId={chat.data.chatId}
                selected={chat.data.chatId === $ui.activeChatId}
                on:click={() => {
                    loadChat(chat.data.chatId);
                }}
            />
        </ListItem>
    </List>
</List>
{#if Object.keys($chatMenuList)?.length == 0}
    <div class="flex flex-col gap-2 text-center text-neutral-500 dark:text-neutral-400">
        <span class="text-2xl">{$t('ui.noChats')}</span>
        <!-- <button title={$t('ui.newChat')} on:click={createChat} class="">
					<Icon icon="mdi:chat-plus-outline" class="md" />
				</button>
				<a href="/" class="underline" on:click={createChat}>{$t('ui.newChat')}</a> -->
    </div>
{/if}
<style>
    :global(:root) {
        --theme-color-primary: red;
        --theme-color-background-alpha: #cccccc;
        --radius-tiny : 4px;
    }
</style>
