<script lang="ts">
    import { t } from '$lib/stores/i18n.js';
    import { page } from '$app/stores';
    import { getTimeTitle } from '$lib/tools/chatMenuList.svelte.js';
    import { format } from 'date-fns';
    import { ui } from '$lib/stores/ui.js';
    import { engine } from '$lib/tools/engine';
    import { groupMessages } from '$lib/tools/chatMenuList.svelte';
    import { idbqlState } from '$lib/db/dbSchema';
    import { Confirm, Looper } from '@medyll/slot-ui';
    import { idbQuery } from '$lib/db/dbQuery';
    import { Button, Icon, Menu, Popper, MenuItem } from '@medyll/slot-ui';
    import { chatMetadata } from '$lib/tools/promptSystem'; 

    //$: showConfigClose = $page.route.id?.includes('/configuration');
    let loadingStae = $state<Record<string, any>>({});
    let chatList = idbqlState.chat.getAll();
    let chatMenuList = $derived(groupMessages(chatList));

    const openCloseConfig = async () => {
        if ($page.route.id?.includes('/configuration')) {
            ui.setActiveChatId();
            engine.goto('/');
        } else {
            engine.goto('/configuration');
        }
    };

    const createChat = async () => {
        // $ui.activeChatId = undefined;
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

    function deleteCha1tHandler(chatId: any) {
        return idbQuery.deleteChat(chatId); 
    }
    async function guess(chatId: any) {
        return chatMetadata.checkTitle(chatId);
    }

    async function categorize(chatId: any) {
        return chatMetadata.checkCategorie(chatId);
    }
    async function describe(chatId: any) { 
        return chatMetadata.checkDescription(chatId) 
        
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
        <div class=" flex-1 gap-4">
            <Button width="auto" icon="mdi:chat-plus-outline" title={$t('ui.newChat')} onclick={createChat}>
                {$t('ui.newChat')}
            </Button>
        </div>
    </div>
    <div class="flex flex-col gap-4">
        <Looper data={chatMenuList}>
            {#snippet children({ item })}
                <div class="text-lg">{$t(getTimeTitle(item?.code))}</div>

                <Looper data={item?.items} class="flex flex-col gap-4  ">
                    {#snippet children({ item })}
                        <div class="p-2" style="content-visibility:auto">
                            <div class="flex gap-2">
                                <div>- category : {item?.category}</div>
                                <div>
                                    <Icon icon="fluent:clock-16-regular" />
                                    {item?.createdAt ? format(new Date(item?.createdAt), 'dd MMMM y hh:mm') : ''}
                                </div>
                            </div>
                            <div class="line-clamp-1 break-all transition duration-300 font-bold py-2">
                                <a title={item?.title} href={`/chat/${item.chatId}`}>{item?.title}</a>
                            </div>
                            <div class="flex flex-1 gap-2">
                                <Confirm
                                    primaryInitial={$t('chat.guess_chat_title')}
                                    primaryConfirm={$t('chat.guess_chat_title')}
                                    iconInitial="question-mark"
                                    secondary="guess"
                                    data={item.chatId as string}
                                    action={guess}
                                    tall="mini" />
                                <Confirm
                                    primaryInitial={$t('chat.delete_chat')}
                                    primaryConfirm={$t('chat.delete_chat')}
                                    iconInitial="mdi:trash"
                                    tall="mini"
                                    value="delete"
                                    data={item.chatId as string}
                                    action={deleteCha1tHandler} />
                                <Confirm
                                    primaryInitial={$t('chat.categorize')}
                                    primaryConfirm={$t('chat.categorize')}
                                    iconInitial="mdi:trash"
                                    tall="mini"
                                    value="categorize"
                                    data={item.chatId as string}
                                    action={categorize} />
                                <Confirm
                                    primaryInitial={$t('chat.describe')}
                                    primaryConfirm={$t('chat.describe')}
                                    iconInitial="mdi:trash"
                                    tall="mini"
                                    value="describe"
                                    data={item.chatId as string}
                                    action={describe} />
                                <Confirm
                                    primaryInitial={$t('chat.tags')}
                                    primaryConfirm={$t('chat.tags')}
                                    iconInitial="mdi:tags"
                                    tall="mini"
                                    value="tags"
                                    data={item.chatId as string}
                                    action={describe} />
                            </div>
                            <div class="text-ellipsis overflow-hidden" style="user-select:text">
                                {@html item?.description ?? ''}
                            </div>
                        </div>
                    {/snippet}
                </Looper>
            {/snippet}
        </Looper>
    </div>
</div>
