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

<div class="application flex w-full h-full overflow-hidden">
	<Notifications />
	<MenuMobile />
	<div class="h-full flex-shrink overflow-hidden z-40 hidden w-[280px] md:block">
		<Sidebar />
	</div>
	<div class="flex-1 flex-v relative overflow-auto z-0">
		<div class="relative"><TopBar /></div>
		<div class="flex-1 flex h-full max-w-full relative overflow-hidden">
			<main class="relative h-full w-full overflow-auto transition-width">
				<slot />
			</main>
		</div>
	</div>
	<Modal show={$showSettings}>
		<Settings />
	</Modal>
</div>
