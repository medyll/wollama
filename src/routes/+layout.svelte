<script lang="ts">
	import { page } from '$app/stores';
	import Settings from '$components/settings/Settings.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import TopBar from '$components/ui/TopBar.svelte';
	import Sidebar from '$components/ui/Sidebar.svelte';
	import { settings, showSettings } from '$lib/stores/settings';
	import '../styles/app.css';
	import '../styles/tailwind.css';
	import '../styles/snippets.css';
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

	export let data;

	// load models into store
	async function loadModels(models: Record<string, any>[]) {
		settings.setSetting('ollamaModels', [...models]);
		if (!$settings.defaultModel) settings.setSetting('defaultModel', models[0].name);
		if ($settings.defaultModel) $activeModels.push($settings.defaultModel);
	}

	onMount(async () => {
		loadModels(data.models);
		engine.checkOllamaEndPoints();

		connectionChecker.subscribe((state) => {
			if (state.connectionStatus === 'error') {
				notifierState.notify('error', 'state.connectionRetryTimeout', 'conn-status');
			} else {
				notifierState.delete('conn-status');
			}
		});
	});

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
	<div class="application flex w-full h-full overflow-hidden">
		<Notifications />
		<MenuMobile />
		<div class="h-full flex-shrink overflow-hidden z-30 hidden w-[280px] md:block">
			<Sidebar />
		</div>
		<div class="flex-1 flex-col flex relative overflow-hidden z-0">
			<TopBar />
			<main class="relative h-full w-full overflow-hidden transition-width">
				<slot />
			</main>
		</div>
		<Modal show={$showSettings}>
			<Settings />
		</Modal>
	</div>
</Opening>
