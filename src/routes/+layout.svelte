<script lang="ts">
	import { page } from '$app/stores';
	import Settings from '$components/settings/Settings.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import TopBar from '$components/ui/TopBar.svelte';
	import Sidebar from '$components/ui/Sidebar.svelte';
	import { settings, showSettings } from '$lib/stores/settings';
	import '../styles/css-properties.css';
	import '../styles/tailwind.css';
	import '../styles/app.css';
	import '../styles/snippets.css';
	import '../styles/skin.css';
	import '@unocss/reset/tailwind.css'
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
	import { OllamaApi } from '$lib/db/ollamaApi';
	import { invoke } from '@tauri-apps/api/tauri'
	// load models into store
	async function loadModels(models: Record<string, any>[]) {
		settings.setSetting('ollamaModels', [...models]);
		if (!$settings.defaultModel) settings.setSetting('defaultModel', models[0].name);
		if ($settings.defaultModel) $activeModels.push($settings.defaultModel);
	}

	onMount(async () => {
		settings.initSettings();
		const apiCall = new OllamaApi();
		let models = [];
		try {
			models = (await apiCall.listModels()) ?? [];
		} catch (e) {
			console.log(e);
		}

		try {
			invoke('close_splashscreen')
		} catch (e) {
			console.log(e);
			
		}
		
		loadModels(models);
		ollamaApiMainOptionsParams.init();
		engine.checkOllamaEndPoints();
		const users = await idbQuery.getUsers(); 
		if(!users.length) {
			idbQuery.insertUser({name: 'user' });
		}
		
		connectionChecker.subscribe(async(state) => {
			if (state.connectionStatus === 'error') {
				notifierState.notify('error', 'state.connectionRetryTimeout', 'conn-status');
			} else {
				notifierState.delete('conn-status');
				models = (await apiCall.listModels()) ?? [];
				loadModels(models);
			}
		});
	});

	$: if($settings.ollamaModels){ 
	}

	$: if (browser && $page.params.id) {
		idbQuery.getChat($page.params.id).then((chat) => {
			if (chat) {
				ui.setActiveChatId($page.params.id);
			} else {
				engine.goto('/');
			}
		});
	} else {
		ui.setActiveChatId();
	}
</script>

<svelte:head>
	<title>wOOllama !</title>
</svelte:head>

<Opening>
	<div class="application">
		<Notifications />
		<MenuMobile />
		<Sidebar />
		<div class="application-content">
			<TopBar />
			<main class="application-main">
				<slot />
			</main>
		</div>
		<Modal show={$showSettings}>
			<Settings />
		</Modal>
	</div>
</Opening>
