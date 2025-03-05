<script lang="ts"> 
    import '../styles/all.css';
    import Settings from '$components/settings/Settings.svelte';
    import TopBar from '$components/ui/TopBar.svelte';
    import Sidebar from '$components/ui/Sidebar.svelte';
    import { settings } from '$lib/stores/settings.svelte';
    import { idbQuery, ideo } from '$lib/db/dbQuery';
    import Notifications from '$components/ui/Notifications.svelte';
    import Opening from '$components/Opening.svelte';
    import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
    import { WollamaApi, wollamaApiConfig } from '$lib/db/wollamaApi';

    import '$lib/playground.js';
    import { idbql } from '$lib/db/dbSchema';
    import { init } from '$lib/init/init';
    import { Backdrop, SlotuiSheet, slotuiMinCssCss } from '@medyll/idae-slotui-svelte';
    import { connectionTimer } from '$lib/stores/timer.svelte';
    import { notifierState } from '$lib/stores/notifications';
    import { cssDom } from '@medyll/idae-dom-events';

    
    let { children } = $props();

    let initiated: boolean = $state(false);
    // load models into store
    async function loadModels() {
        try {
            let tags = (await WollamaApi.tags()) ?? {};
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
        if (!initiated) wollamaApiConfig.setOptions({ host: $settings.ollama_server, model: $settings.defaultModel });
    }

    async function loader() {
        settings.initSettings();

        await loadConfig();
        await loadOthers();
        await init();
    }

    $effect(() => {
        /* ideo("agent").create({ code: "tesst", name: "test" }).then((data) => {
            console.log(data);
        }); */
        connectionTimer.initialize(
            'http://127.0.0.1:11434',
            (data) => {
                loadModels();
            },
            (data) => {
                loadModels();
                notifierState.notify('success', `Connection successfully established to ${data.url}`);
                console.log({ data });
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

    /* let a = {
        name: 'toggler',
        selector: 'data-toggler',
        actions: (element, changes) => {
            // toggler-for

            return {
                attrs: {
                    '[toggler-for]': '',
                },
            };
        },
    };
    let b = {
        name: 'shower',
        selector: 'data-toggler',
        actions: (element, changes) => {
            // toggler-for
            const withAttr = () => {};

            return {
                withAttr: ['[show]', withAttr],
                attrs: {
                    '[toggler-for]': () => {},
                },
            };
        },
    };

    let test = b.actions('element', 'changes');
    console.log(Object.getOwnPropertyNames(b.actions));
    console.log(Object.getOwnPropertyNames(test));

    console.log({ test }); */

    /* detectAndAct('.application-container', {
        attributes: ['data-action', 'class', 'style'],
        trackCharacterData: false,
        trackChildList: false,
        trackResize: false,
    }).actions((element, changes) => { 
        changes?.onResize;
        console.log('.application-container', element, changes);
    }); */

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

    export function detectAndAct(selector: string, { attributes, trackChildList, trackCharacterData, trackResize }) {
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
                    callback(element, {
                        attributes: mutation,
                        childList: mutation,
                        characterData: mutation,
                        resize: changes.resize,
                    });
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
<div class="breakpoint-spy"></div>
<SlotuiSheet breakpoints={{}} />
<Backdrop isLoading={false} isOpen={false}>
    <Settings />
</Backdrop>
<div class="application-body">
    <Notifications />
    <Sidebar />
    <div class="application-content">
        <TopBar />
        <main class="application-main">
            {@render children?.()}
        </main>
    </div>
</div>

