<script lang="ts">
    import 'virtual:uno.css';
    import Settings from '$components/settings/Settings.svelte';
    import TopBar from '$components/ui/TopBar.svelte';
    import Sidebar from '$components/ui/Sidebar.svelte';
    import { settings } from '$lib/stores/settings.svelte';
    import '../styles/css-properties.css';
    import '../styles/tailwind.css';
    import '../styles/app.css';
    import '../styles/snippets.css';
    import '../styles/skin.css';
    import '@unocss/reset/tailwind.css';
    import { idbQuery } from '$lib/db/dbQuery';
    import Notifications from '$components/ui/Notifications.svelte';
    import Opening from '$components/Opening.svelte';
    import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
    import { OllamaApi, ollamaApiConfig } from '$lib/db/ollamaApi';

    import '$lib/playground.js';
    import { idbql } from '$lib/db/dbSchema';
    import { init } from '$lib/init/init';
    import { Backdrop } from '@medyll/slot-ui';
    import { connectionTimer } from '$lib/stores/timer.svelte';
    import { notifierState } from '$lib/stores/notifications';
    import { cssDom, HtmluDom } from '@medyll/htmludom';
    let { children } = $props();

    let initiated: boolean = $state(false);
    // load models into store
    async function loadModels() {
        try {
            let tags = (await OllamaApi.tags()) ?? {};
            if (!tags || !tags.models) return;
            let models = tags.models;
            settings.setSetting('ollamaModels', [...models]);
            if (!$settings.defaultModel) settings.setSetting('defaultModel', models[0].name);
        } catch (e) {
            console.log(e);
        }
    }

    async function loadOthers() {
        try {
            let a = await idbql.agent.where({ code: { eq: 'tesst' } });
        } catch (e) {
            console.log(e);
        }
        //
        ollamaApiMainOptionsParams.init();

        const users = await idbQuery.getUsers();
        if (users.length < 0) {
            idbQuery.insertUser({ name: 'Mydde' });
        }
    }

    async function loadConfig() {
        if (!initiated) ollamaApiConfig.setOptions({ ollama_endpoint: $settings.ollama_server, model: $settings.defaultModel });
    }

    async function loader() {
        settings.initSettings();

        await loadConfig();
        await loadOthers();
        await init();
    }

    $effect(() => {
        connectionTimer.initialize(
            'http://127.0.0.1:11434',
            (data) => {
                loadModels();
            },
            (data) => {
                loadModels();
                notifierState.notify('success', `Connection successfully established to ${data.url}`);
            },
            (data) => {
                notifierState.notify('error', `Connection failure on ollama endpoint ${data.url}`);
                console.log('url', data);
            }
        );
    });

    $effect.pre(() => {
        loader();
        initiated = true;
    });

    detectAndAct('.application-container', ['data-action', 'class', 'style'])
        .resize()
        .characterData()
        .childList()
        .actions((element, changes, mutation) => {
            console.log('button', element, changes, mutation);
        });

    type DetectAndActCallback = (
        element: Element,
        changes: {
            attributes?: string[];
            childList?: boolean;
            characterData?: boolean;
            resize?: boolean;
        },
        mutation?: MutationRecord
    ) => void;

    export function detectAndAct(selector: string, attributes?: string[] | boolean) {
        let trackResize = false;
        let trackChildList = false;
        let trackCharacterData = false;

        const api = {
            resize: () => {
                trackResize = true;
                return api;
            },
            childList: () => {
                trackChildList = true;
                return api;
            },
            characterData: () => {
                trackCharacterData = true;
                return api;
            },
            actions: (callback: DetectAndActCallback) => {
                const options = {
                    onlyNew: false,
                    trackResize,
                    trackChildList,
                    trackAttributes: attributes,
                    trackCharacterData,
                };

                const cssObserver = cssDom(selector, options).each((element, mutation) => {
                    const changes = {
                        resize: trackResize,
                        attributes: attributes ? [mutation?.attributeName!] : undefined,
                        childList: mutation?.type === 'childList',
                        characterData: mutation?.type === 'characterData',
                    };
                    console.log(element, changes, mutation);
                    callback(element, changes, mutation);
                });

                return {
                    stop: () => {
                        cssObserver.destroy();
                    },
                };
            },
        };

        return api;
    }
</script>

<svelte:head>
    <title>wOOllama !</title>
</svelte:head>

<Backdrop isLoading={false} isOpen={false}>
    <Settings />
</Backdrop>
<div class="application">
    <Notifications />
    <Sidebar />
    <div class="application-content">
        <TopBar />
        <main class="application-main">
            {@render children?.()}
        </main>
    </div>
</div>

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
