<script lang="ts">
    import 'virtual:uno.css';
    import { page } from '$app/stores';
    import Settings from '$components/settings/Settings.svelte';
    import Modal from '$components/ui/Modal.svelte';
    import TopBar from '$components/ui/TopBar.svelte';
    import Sidebar from '$components/ui/Sidebar.svelte';
    import { settings, showSettings } from '$lib/stores/settings.svelte';
    import '../styles/css-properties.css';
    import '../styles/tailwind.css';
    import '../styles/app.css';
    import '../styles/snippets.css';
    import '../styles/skin.css';
    import '@unocss/reset/tailwind.css';
    import { engine } from '$lib/tools/engine';
    import { onMount } from 'svelte';
    import { idbQuery } from '$lib/db/dbQuery';
    import { ui } from '$lib/stores/ui';
    import { activeModels } from '$lib/stores';
    import MenuMobile from '$components/ui/MenuMobile.svelte';
    import { browser } from '$app/environment';
    import Notifications from '$components/ui/Notifications.svelte';
    import { notifierState } from '$lib/stores/notifications';
    import { connectionChecker } from '$lib/stores/connection';
    import Opening from '$components/Opening.svelte';
    import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
    import { OllamaApi, ollamaApiConfig } from '$lib/db/ollamaApi';

    import '$lib/playground.js';
    import { IDbFields } from '$lib/db/dbFields';
    import { idbql, schemeModel } from '$lib/db/dbSchema';
    import { init } from '$lib/init/init';

    let { children } = $props();

    // load models into store
    async function loadModels(models: Record<string, any>[]) {
        if (!models) return;
        settings.setSetting('ollamaModels', [...models]);
        if (!$settings.defaultModel) settings.setSetting('defaultModel', models[0].name);
        if ($settings.defaultModel) $activeModels.push($settings.defaultModel);
    }

    onMount(async () => {
        settings.initSettings();

        ollamaApiConfig.setOptions({ ollama_endpoint: $settings.ollama_server, model: $settings.defaultModel });

        let models: { models: Record<string, any>[] } = { models: [{}] };

        try {
            models = (await OllamaApi.tags()) ?? {};
            loadModels(models.models);
        } catch (e) {
            console.log(e);
        }
        try { 
            let a = await idbql.agent.where({ code: { eq: 'tesst' } });
            if(!a[0]){
                // create agent from promptLib
            }
        } catch (e) {
            console.log(e);
        }
        //
        ollamaApiMainOptionsParams.init();
        engine.checkOllamaEndPoints();

        const users = await idbQuery.getUsers();
        if (users.length < 0) {
            idbQuery.insertUser({ name: 'Mydde' });
        }

        connectionChecker.subscribe(async (state) => {
            if (state.connectionStatus === 'error') {
                notifierState.notify('error', 'state.connectionRetryTimeout', 'conn-status');
            } else {
                notifierState.delete('conn-status');
                models = (await OllamaApi.tags()) ?? {};
                loadModels(models.models);
            }
        });

        init();

        let test = new IDbFields(schemeModel);

        /* let val = test.parsIdbType('fk-agentPrompt.id');
        let val2 = test.parseCollectionFieldName('agent', 'name'); */
        /* let val3 = test.parseAllCollections();
        console.log(val3); */
    });
</script>

<svelte:head>
    <title>wOOllama !</title>
</svelte:head>

{#snippet sideBar()}
    {#snippet sideBar_vendor()}
        <h vendor />
    {/snippet}
    {#snippet sideBar_search()}
        <row search>
            <search />
        </row>
    {/snippet}
    {#snippet sideBar_chatMenuList()}
        <column :nav chatMenuList>
            <row> <h /></row>
            <row><button /></row>
        </column>
    {/snippet}
{/snippet}

<Opening>
    <div class="application">
        <Notifications />
        <!-- <MenuMobile /> -->
        <Sidebar />
        <div class="application-content">
            <TopBar />
            <main class="application-main">
                {@render children?.()}
            </main>
        </div>
        <Modal show={$showSettings}>
            <Settings />
        </Modal>
    </div>
</Opening>

<style>
    :global(svg) {
        color: var(--cfab-icon-color);
    }
    :global(:root) {
        --theme-color-foreground-alpha-high: var(--cfab-paper-border-color);
        --theme-color-background: var(--cfab-bg);
        --theme-color-primary: var(--cfab-primary);
        --theme-color-background-alpha: #cccccc;
        --radius-tiny: 4px;
    }
</style>
