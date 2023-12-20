<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MainChat from '$components/chat/MainChat.svelte';
	import Settings from '$components/settings/Settings.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Navbar from '$components/ui/Navbar.svelte';
	import Sidebar from '$components/ui/Sidebar.svelte';
	import { settings, showSettings } from '$lib/stores/settings';
	import { ApiCall } from '$lib/tools/apiCall';
	import '../styles/app.css';
	import '../styles/tailwind.css';
	import '../styles/snippets.css';
	import { engine } from '$lib/tools/engine';
	import { onMount } from 'svelte';
	import { DataBase, dbase, dbase2 } from '$lib/db/dbSchema';
	import { dbQuery } from '$lib/db/dbQuery';
	import { ui } from '$lib/stores/ui';
	import { activeModels } from '$lib/stores';
	import MenuMobile from '$components/ui/MenuMobile.svelte';

	// auto-load models
	async function modelS() {
		const ollamaFetcher = new ApiCall();
		const models = await ollamaFetcher.listModels();

		settings.setParameterValue('ollamaModels', [...models]);
		if (!$settings.defaultModel) settings.setParameterValue('defaultModel', models[0].name);
		if ($settings.defaultModel) $activeModels.push($settings.defaultModel);
	}

	engine.checkOllamaEndPoints();

	modelS();
	$: console.log(dbase2) 

 	onMount(async () => {
		const dbase = new DataBase();
		dbase.init();
	});

	$: if ($page.params.id) {
		dbQuery.getChat($page.params.id).then((chat) => {
			if (chat) {
				ui.setActiveChatId($page.params.id);
			} else {
				goto('/');
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
	<MenuMobile />
	<div class="h-full flex-shrink overflow-hidden z-50 hidden w-[280px] md:block">
		<Sidebar />
	</div>
	<div class="flex-1 flex-v relative overflow-auto z-0">
		<div class="relative"><Navbar /></div>
		<div class="flex-1 flex h-full max-w-full relative overflow-hidden">
			<main class="relative h-full w-full  overflow-auto transition-width">
				<slot><MainChat /></slot>
			</main>
		</div>
	</div>
	<Modal show={$showSettings}>
		<Settings />
	</Modal>
</div>
