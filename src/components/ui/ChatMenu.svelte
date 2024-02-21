<script lang="ts">
    import { getTimeTitle, chatMenuList } from '$lib/tools/chatMenuList.js';
    import ChatMenuItem from '$components/chat/input/ChatMenuItem.svelte';
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

<List class="flex flex-col flex-v gap-2" data={$chatMenuList ?? []} let:item>
    <div class="font-bold whitespace-nowrap text-ellipsis soft-title">
        {$t(getTimeTitle(item.code))}
    </div>
    <hr />
    <List class="flex flex-col flex-v" data={item.items ?? []} let:item={chat}>
        <div class="listItem">
            <ChatMenuItem
                chatId={chat.chatId}
                on:click={() => {
                    loadChat(chat.chatId);
                }}
            />
        </div>
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

<style lang="postcss">
    .listItem {
        @include ui-density-presets;
        display: flex;
        align-items: center;
        position: relative;
        border-radius: 4px;
        max-width: 100%;

        .listItemContent {
            flex: 1;
            min-width: auto;
            overflow: hidden;
            padding: 0 0.5rem;

            [slot='listItemPrimary'] {
                text-overflow: ellipsis;
                display: block;
                width: 100%;
                overflow: hidden;
            }

            [slot='listItemSecondary'] {
                opacity: 0.8;
                text-overflow: ellipsis;
                display: block;
                width: 100%;
                overflow: hidden;
            }
        }

        [slot='listItemAction'] {
            padding: 0 0.5rem;
        }

        [slot='listItemIcon'] {
            text-align: center;
            width: 2rem;
            min-width: 2rem;
            overflow: hidden;
            opacity: 0.8;
        }
    }

    li.listItemTitle {
        position: sticky;
        margin-top: 0px !important;
        top: 0px;
        background-color: var(--theme-color-background-alpha-low);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        z-index: 1;
    }

    [slot='listFooter'] {
        position: sticky;
        margin-bottom: 0px !important;
        bottom: 0px;
        background-color: var(--theme-color-background-alpha-low);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        z-index: 1;
    }

    li.listItem {
        @include data-hover;
        @include data-selected;
        @include ui-density-presets;

        &.selected,
        &[data-selected='true'] {
            .listItemChip {
                position: absolute;
                height: 50%;
                width: 3px;
                background-color: var(--theme-color-primary);
                border-radius: 8px;
                left: 2px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
        }
    }
</style>
