<script lang="ts">
    import Confirm from '$components/fragments/Confirm.svelte';
    import { idbQuery } from '$lib/db/dbQuery';
    import { ui } from '$lib/stores/ui';
    import type { DbChat } from '$types/db';
    import Icon from '@iconify/svelte';
    import { liveQuery } from 'dexie';

    export let chatId: string;

    $: chat = liveQuery(() => {
        if (chatId) return idbQuery.getChat(chatId);
    });

    $: active = Boolean($ui.activeChatId === chatId);

    let editChat: boolean = false;

    function deleteCha1tHandler() {
        idbQuery.deleteChat(chatId);
        if ($ui.activeChatId === chatId) {
            ui.setActiveChatId(undefined);
        }
    }

    function editChatTitleHandler() {
        editChat = true;
    }
</script>

<div class="flex flex-align-middle relative w-full h-10 pl-2 {active ? 'active' : ''}">
    <span class="listItemChip"></span>
    <button on:click class="overflow-hidden button">
        <!-- <div class="w-6 text-left {active ? '  font-bold' : 'opacity-50'}">
            <Icon icon={active ? 'carbon:chat-operational' : 'carbon:chat'} class="md  " />
        </div> -->
        {#if editChat}
            <input type="text" bind:value={$chat.title} />
            <button on:click={editChatTitleHandler}>
                <Icon icon="mdi:check" />
            </button>
        {:else}
            <span class="w-full whitespace-nowrap overflow-hidden">
                {$chat?.title}
            </span>
        {/if}
    </button>
    {#if active}
        <div class="line-gap-2">
            <button
                class="borderButton"
                on:click={() => {
                    editChat = true;
                }}
            >
                <Icon icon="mdi:edit" />
            </button>
            <Confirm validate={deleteCha1tHandler}>
                <Icon icon="mdi:delete" />
            </Confirm>
        </div>
    {/if}
</div>

<style lang="postcss">
    .button {
        @apply block w-full text-left flex   items-center px-1 py-1 gap-2 transition whitespace-nowrap text-ellipsis hover:bg-gray-200 dark:hover:bg-gray-800;
    }
    .active {
        @apply font-bold; 
		@apply shadow-sm;
            border-radius: 4px;
		 background-color: rgba(255, 255, 255, 0.1);
    }

    .active {
        .listItemChip {
            position: absolute;
            height: 55%;
            width: 4px;
            background-color: #005fb8;
            border-radius: 8px;
            left: 2px;
            border: 1px solid 005fb8;
        }
    }
</style>
