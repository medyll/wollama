<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/stores/i18n.js';
    import { page } from '$app/stores';

    import { ui } from '$lib/stores/ui.js';
    import { engine } from '$lib/tools/engine';
    import ChatList from './ChatList.svelte';

    $: showConfigClose = $page.route.id?.includes('/configuration');

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
        engine.goto('/');
        engine.goto('/');
    };

    const openSettings = async () => {
        engine.goto('/settings');
    };
</script>

<div class="application-sideBar">
    <div class="line-gap-2 px-2" style="height:34px;">
        <img alt="logo" class="iconify" width="16" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
        <div class="text-md">wOollama !</div>
        <full />
    </div>
    <div class="px-2 w-full">
        <input class="w-full" type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
    </div>
    <hr class="ml-auto w-24" />
    <div class="application-sideBar-title">
        <div class="hidden md:flex gap-4">
            <button title={$t('ui.newChat')} on:click={createChat}>
            {$t('ui.newChat')}
                <Icon icon="mdi:chat-plus-outline" class="md" alt={$t('ui.newChat')} />
            </button>
        </div>
    </div>
    <hr class="ml-auto w-24" />
    <div class="application-sideBar-content">
        <ChatList />
    </div>
    <hr class="ml-auto w-24" />
    <column>
        <full />
        <button title={$t('ui.settings')} class="p2" on:click={() => openSettings()}>
            {$t('ui.settings')} <Icon icon="mdi:cog-outline" style="font-size:1.6em" /> 
        </button>
    </column>
</div>
