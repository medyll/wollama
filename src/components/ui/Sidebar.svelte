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
    }
</script>

<div class="application-sideBar">
    <div class="flex-v h-full w-full gap-2 p-3">
        <div class="line-gap-2 py-2 relative">
            <div class="line-gap-2 flex-1">
                <img alt="logo" class="iconify" width="24" src="/assets/svg/lama.svg" style="transform: scaleX(-1)" />
                <div class="font-semibold text-xl">wOollama !</div>
                <div class="hidden md:block absolute border theme-border theme-bg rounded-full gap-2 p-2 right-0">
                    <button title={$t('ui.newChat')} on:click={createChat} class="aspect-square">
                        <Icon icon="mdi:chat-plus-outline" class="lg" />
                    </button>
                </div>
            </div>
        </div>
        <input type="search" placeholder={$t('ui.searchChats')} bind:value={$ui.searchString} />
        <hr class="ml-auto w-24" />
        <div class="flex-1">
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
</div>

<wrist> application-sideBar logo title create-chat input-search chat-title chat-group chat-group-title chat-button application-content </wrist>

<style>
    wrist {
        display: none;
    }
</style>
