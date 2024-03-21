<svelte:options runes accessors />

<script lang="ts">
    import Confirm from '$components/fragments/Confirm.svelte';
    import { idbQuery } from '$lib/db/dbQuery';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import Icon from '@iconify/svelte';
    import { Button, Menu, Popper, MenuItem } from '@medyll/slot-ui';

    import { chatUtils } from '$lib/tools/chatUtils';

    import { idbqlState } from '$lib/db/dbSchema';


    const  {
        chatId  = '',
        selected  = false,
    } = $props()

    let chat = $derived(idbQuery.getChat(chatId));

    let editChat: boolean = false;
    let isOpen: boolean = false;
    let title = chat?.title;
   // $: title = chat?.title;

    function deleteCha1tHandler() {
        idbQuery.deleteChat(chatId);
        if ($ui.activeChatId === chatId) {
            ui.setActiveChatId(undefined);
        }
    }

    function editChatTitleHandler() {
        editChat = true;
    }

    function toggleEdit(visible?: boolean) {
        editChat = visible === undefined ? !editChat : visible;
    }

    function togglePopper() {
        isOpen = !isOpen;
    }

    function guess() {
        chatUtils.checkTitle(chat.chatId);
    }

    function onSubmit(event: Event) {
        const { title } = event.currentTarget as HTMLFormElement;
        isOpen = false;
        toggleEdit(false);
        idbQuery.updateChat(chatId, { title: title.value });
    }
 
    $inspect(idbQuery.getChat(chatId));
 
</script>

<div class="line-gap-2">
    {#if editChat && selected}
        <form id="chat-form" on:submit|preventDefault={onSubmit} />
        <input class="naked tight" form="chat-form" type="text" flex-1 h-auto value={title} name="title" />
        <button form="chat-form" type="submit">
            <Icon icon="mdi:check" />
        </button>
        <button
            aspect-square
            on:click|preventDefault={() => {
                toggleEdit(false);
                return false;
            }}>
            <Icon icon="mdi:cancel" />
        </button>
    {:else}
        <button on:click class="w-full whitespace-nowrap overflow-hidden text-left text-ellipsis">
            {chat?.title}
        </button>
    {/if}
    {#if selected && !editChat}
        <Popper bind:isOpen position="BC" autoClose class="w-48">
            <Button link slot="popperHolder" icon="mdi:ellipsis-vertical" height="auto" on:click={togglePopper} />
            <Menu class="w-full">
                <MenuItem
                    icon="mdi:edit"
                    text={$t('chat.edit_chat_title')}
                    on:click={() => {
                        toggleEdit(true);
                    }} />
                <MenuItem icon="fluent-mdl2:status-circle-question-mark">
                    <Confirm validate={guess}>{$t('chat.guess_chat_title')}</Confirm>
                </MenuItem>
                <MenuItem icon="mdi:delete">
                    <Confirm validate={deleteCha1tHandler}>{$t('chat.delete_chat')}</Confirm>
                </MenuItem>
            </Menu>
        </Popper>
    {/if}
</div>

<style lang="postcss">
    .button {
        @apply block w-full text-left flex   items-center px-1 py-1 gap-2 transition whitespace-nowrap text-ellipsis  dark:hover:bg-gray-800;
    }
</style>
