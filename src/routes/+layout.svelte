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
	import { DataBase, dbase } from '$lib/db/dbSchema';
	import { dbQuery } from '$lib/db/dbQuery';
	import { ui } from '$lib/stores/ui';
	import { activeModels } from '$lib/stores';

	// auto-load models
	async function modelS() {
		const ollamaFetcher = new ApiCall();
		const models = await ollamaFetcher.listModels();

		settings.setParameterValue('ollamaModels', [...models]);
		if (!$settings.defaultModel) settings.setParameterValue('defaultModel', models[0].name);
		$activeModels.push($settings.defaultModel);
	}

	engine.checkOllamaEndPoints();

	modelS();

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
	}else{
		ui.setActiveChatId();
	}
</script>

<svelte:head>
	<title>wOOllama !</title>
</svelte:head>

<div class="application flex w-full h-full overflow-hidden ">
	<div class="h-full overflow-hidden z-50">
		<Sidebar />
	</div>
	<div class="flex-1 relative overflow-auto z-0">
		<div class="flex-v flex-1 h-full">
			<div class="relative"><Navbar /></div>
			<div class="flex-1 w-full relative">
				<div class="h-full relative overflow-hidden mx-auto max-w-3xl">
					<slot><MainChat /></slot>
				</div>
			</div>
		</div>
	</div>
	<Modal show={$showSettings}>
		<Settings />
	</Modal>
</div>
