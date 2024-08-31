<script lang="ts">
    import { t } from '$lib/stores/i18n.js';
    import { page } from '$app/stores';

    import { ui } from '$lib/stores/ui.js';
    import { engine } from '$lib/tools/engine';
    import ChatList from './ChatList.svelte';
    import { Icon, MenuList, MenuListItem } from '@medyll/idae-slotui-svelte';
    import { settings } from '$lib/stores/settings.svelte';
    import { goto } from '$app/navigation';

    const openCloseConfig = async () => {
        if ($page.route.id?.includes('/configuration')) {
            ui.setActiveChatId();
            engine.goto('/');
        } else {
            engine.goto('/configuration');
        }
    };

    const openLibgs = () => {
        settings.setSetting('menuExpanded', !$settings.menuExpanded);
    };

    const getChatLink = (link: 'settings' | 'chat' | 'newChat' | 'lib' | 'explore' | 'books') => {
        let goTo;
        switch (link) {
            case 'settings':
                goTo= `${window.location.origin}/settings`;
            case 'chat':
                goTo= `chat/${link}`;
            case 'newChat':
                goTo= `${window.location.origin}/chat`;
            case 'lib':
                goTo= `${window.location.origin}/lib`;
            case 'explore':
                goTo= `${window.location.origin}/explore`;
            default:
                goTo= `${window.location.origin}/${link}`;
        }
        goto(goTo)
    };
</script>

<div class="application-sideBar" aria-expanded={$settings.menuExpanded}>
    <div class="not-expanded">
        <div class="not-expanded line-gap-2 p-4">
            <img alt="logo" class="iconify" width="32" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
            <div class="text-md">wOollama !</div>
            <full />
        </div>
        <div class="px-2 w-full">
            <input class="w-full" type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
        </div>
    </div>
    <div class="application-sideBar-menu">
        <MenuList tall="kind" class="flex flex-col h-full">
            <MenuListItem selectable={false} onclick={getChatLink('newChat')} title={$t('ui.newChat')}>
                <Icon icon="mdi:plus" alt={$t('ui.newChat')} />
                <span>{$t('ui.newChat')}</span>
            </MenuListItem>
            <MenuListItem onclick={getChatLink('lib')} title={$t('ui.mylib')}>
                <Icon icon="fluent:library-20-filled" alt={$t('ui.mylib')} />
                <span>{$t('ui.myLib')}</span>
            </MenuListItem>
            <div class="application-sideBar-content flex-1 overflow-auto">
                <ChatList />
            </div>
            <MenuListItem  selectable={false} width="full" title={$t('ui.settings')} onclick={openLibgs}>
                <span>{$t('ui.expand')}</span>
                <Icon icon="ri:expand-right-line" alt={$t('ui.settings')} class="red" />
            </MenuListItem>
            <hr />
           <!--  <MenuListItem title={$t('ui.books')} onclick={getChatLink('books')}>
                <Icon icon="settings" alt={$t('ui.books')} />
                <span>{$t('ui.books')}</span>
            </MenuListItem>
            <MenuListItem title={$t('ui.settings')} onclick={getChatLink('explore')}>
                <Icon icon="settings" alt={$t('ui.newChat')} />
                <span>{$t('ui.settings')}</span>
            </MenuListItem> -->
            <MenuListItem title={$t('ui.settings')} onclick={getChatLink('settings')}>
                <Icon icon="settings" alt={$t('ui.newChat')} />
                <span>{$t('ui.settings')}</span>
            </MenuListItem>
        </MenuList>
    </div>
</div>

<style lang="scss">
    :global(.red) {
        transition: all 1s ease;
    }
    .application-sideBar {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        .application-sideBar-menu {
            flex: 1;
        }
        .application-sideBar-content {
            content-visibility: hidden;
            overflow: auto;
        }
        :global(.menu-list-item-text) {
            @apply flex flex-1 gap-2 items-center;
            @apply overflow-hidden;
            width: 100%;
        }

        span {
            @apply text-ellipsis overflow-hidden block;
            /* @apply flex flex-1 gap-2 items-center; */
            text-align: center;
            max-width: 100%;
            width: 100%;
        }
        &[aria-expanded='false'] {
            @apply lg:w-[80px] lg:flex;
            .not-expanded {
                display: none;
                content-visibility: hidden;
            }
        }
        &[aria-expanded='true'] {
            @apply lg:w-[240px] lg:flex;
            .application-sideBar-content {
                content-visibility: visible;
            }
            span {
                @apply text-sm;
                text-align: left;
                width: 100%;
            }

            :global(.red) {
                transition: all 1s ease;
                rotate: 180deg;
            }
        }
        &[aria-expanded='false'] {
            /* width: 70px; */
            span {
                @apply text-lg;
                display: none;
            }
        }
    }
</style>
