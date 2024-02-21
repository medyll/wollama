<script lang="ts">
    import Icon from '@iconify/svelte';
    import { t } from '$lib/stores/i18n.js';
    import { page } from '$app/stores';

    import { ui } from '$lib/stores/ui.js';
    import ChatList from '$components/ui/ChatMenu.svelte';
    import { engine } from '$lib/tools/engine';

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
        engine.goto('/');
        ui.setActiveChatId();
        engine.goto('/');
    };

    const openSettings = async () => {
        engine.goto('/settings');
    };
</script>

<div class="application-sideBar">
    <div class="line-gap-2 px-2" style="height:34px;">
        <img alt="logo" class="iconify" width="24" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
        <div class="font-semibold text-xl">wOollama !</div>
        <full />
        <div class="hidden md:flex theme-bg">
            <button style="height:35px;width:35px" title={$t('ui.newChat')} on:click={createChat}>
                <Icon icon="mdi:chat-plus-outline" class="md" alt={$t('ui.newChat')} />
            </button>
        </div>
    </div>
    <div class="px-2 w-full">
        <input class="w-full" type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
    </div>
    <hr class="ml-auto w-24" />
    <div class="application-sideBar-title px-3">{$t('ui.myChats')}</div>
    <div class="application-sideBar-content paper flex-1 w-full">
        <ChatList />
    </div>
    <column>
        <button class="btn" on:click={openCloseConfig}>
            {#if showConfigClose}
                <Icon icon="mdi:close-circle" class="text-blue lg " style="font-size:1.6em;color:red" />
            {/if}
            {$t('settings.configureOllama')}
        </button>
        <full />
        <button title={$t('ui.settings')} class="" on:click={() => openSettings()}>
            <Icon icon="mdi:cog-outline" style="font-size:1.6em" /> configure
        </button>
    </column>
</div>

<wrist> application-sideBar logo title create-chat input-search chat-title chat-group chat-group-title chat-button application-content </wrist>

<style>
    wrist {
        display: none;
    }
</style>
