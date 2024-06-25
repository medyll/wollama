<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/stores/i18n.js';
    import { page } from '$app/stores';
    import { getTimeTitle, groupChatMessages } from '$lib/tools/chatMenuList.svelte.js';

    import { ui } from '$lib/stores/ui.js';
    import { engine } from '$lib/tools/engine';
    import ChatList from '../../../components/ui/ChatList.svelte';
    import { groupMessages } from '$lib/tools/chatMenuList.svelte';
    import { idbqlState } from '$lib/db/dbSchema';
    import { Confirm, Looper } from '@medyll/slot-ui';
    import { idbQuery } from '$lib/db/dbQuery';
    import { chatUtils } from '$lib/tools/chatUtils';

    //$: showConfigClose = $page.route.id?.includes('/configuration');
    let chatMenuList = $derived(groupMessages(idbqlState.chat.getAll()));

    const openCloseConfig = async () => {
        if ($page.route.id?.includes('/configuration')) {
            ui.setActiveChatId();
            engine.goto('/');
        } else {
            engine.goto('/configuration');
        }
    };

    const createChat = async () => {
        $ui.activeChatId = undefined;
        ui.setActiveChatId();
        engine.goto('/');
        engine.goto('/');
    };

    const openSettings = async () => {
        engine.goto('/settings');
    };
    const openLibgs = async () => {
        engine.goto('/lib');
    };

    const loadChat = async (id: string) => {
        ui.setActiveChatId(id);
        ui.showHideMenu(false);
        engine.goto(`/chat/${id}`);
    };

    function deleteCha1tHandler(chat) {
        /*  idbQuery.deleteChat(chatId);
        if ($ui.activeChatId === chatId) {
            ui.setActiveChatId(undefined);
        } */
    }
    function guess(chat) {
        chatUtils.checkTitle(chat.chatId);
    }
</script>

<div class="flex flex-align-middle justify-between p-4 gap-4">
    <div class=" "><Icon icon="mdi:settings" class="md" /></div>
    <div class="flex-1 text-2xl font-medium self-center capitalize">{$t('ui.myLib')}</div>
    <input type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
</div>
<div class="flex flex-col p-4 gap-4">
    <div class="flex gap-4 py-4 flex-align-middle border-b">
        <div>
            {$t('ui.threads')}
        </div>
        <div class="hidden md:flex gap-4">
            <button title={$t('ui.newChat')} onclick={createChat}>
                {$t('ui.newChat')}
                <Icon icon="mdi:chat-plus-outline" class="md" alt={$t('ui.newChat')} />
            </button>
        </div>
    </div>
    <div class="flex flex-col gap-4 w-348">
        <Looper data={chatMenuList}>
            {#snippet children({ item })}
                <div class="border-b"><h4>- {$t(getTimeTitle(item?.code))}</h4></div>

                <Looper data={item?.items} class="flex flex-col gap-4 w-348">
                    {#snippet children({ item })}
                        <div class="p-2">
                            <div class="line-clamp-1 break-all transition duration-300  ">
                                {item?.title}
                            </div>
                            <div class="flex gap-2">
                                <button
                                    onclick={() => {
                                        loadChat(item.chatId);
                                    }}>load</button>
                                <Confirm
                                    icon="delete"
                                    validate={() => {
                                        deleteCha1tHandler(item.chatId);
                                    }}>
                                    {#snippet confirmInitial()}
                                        {$t('chat.delete_chat')}
                                    {/snippet}</Confirm
                                > 
                                <Confirm
                                    validate={() => {
                                        guess(item.chaiId);
                                    }}>
                                    {#snippet confirmInitial()}
                                        {$t('chat.guess_chat_title')}
                                    {/snippet}
                                </Confirm>
                            </div>
                            <div class="text-ellipsis overflow-hidden">
                              item?.description goes here   {item?.description}
                            </div>
                        </div>
                    {/snippet}
                </Looper>
            {/snippet}
        </Looper>
    </div>
</div>
