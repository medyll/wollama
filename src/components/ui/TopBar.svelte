<script lang="ts">
    import { t } from '$lib/stores/i18n';
    import Icon from '@iconify/svelte';
    import StatusBar from '../settings/StatusBar.svelte';
    import { ui } from '$lib/stores/ui';
    import { engine } from '$lib/tools/engine';
    import { dbase } from '$lib/db/dbSchema';
    import { idbQuery } from '$lib/db/dbQuery';
    import { page } from '$app/stores';
    import { appWindow } from '@tauri-apps/api/window';

    new Date().getSeconds();

    $: chat = idbQuery.getChat($ui.activeChatId);

    $: showConfigClose = $page.route.id?.includes('/configuration');

    const openCloseConfig = async () => {
        if ($page.route.id?.includes('/configuration')) {
            ui.setActiveChatId();
            engine.goto('/');
        } else {
            engine.goto('/configuration');
        }
    };
</script>

<div  data-tauri-drag-region class="titlebar application-topBar"  >
    <full />
    <div class="text-center soft-title">
        {#await chat then value}
            {value?.title ?? ''}
        {/await}
    </div>
<input value="red" class="input" />
    <StatusBar />
    <full />
    <div>
        <button on:click={()=>{appWindow.minimize}} class="titlebar-button" id="titlebar-minimize">
            <Icon icon="fluent-mdl2:chrome-minimize" alt="minimize" />
        </button>
        <button on:click={()=>{appWindow.toggleMaximize}} class="titlebar-button" id="titlebar-maximize">
            <Icon icon="fluent-mdl2:chrome-restore" alt="restore" />
            <!-- <img src="https://api.iconify.design/mdi:window-maximize.svg" alt="maximize" /> -->
        </button>
        <button on:click={()=>{appWindow.close}} class="titlebar-button titlebar-button-close" id="titlebar-close">
            <Icon icon="fluent-mdl2:chrome-close" alt="close" />
        </button>
    </div>
</div>

<style lang="postcss">
    .titlebar {
        user-select: none;
        display: flex;
        justify-content: flex-end;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9000;
        gap: 0; 

        button {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            width: 45px;
            height: 100%;
                transition: all 0.2s;

            &:hover {
                background: #ededed;
            }
        }

        .titlebar-button-close:hover {
            background: rgb(232, 17, 35);
            color: white;
        }

        :global(svg) {
            color: rgb(139, 148, 158);
        }
    }
</style>
