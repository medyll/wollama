<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MainChat from '$lib/components/MainChat.svelte';
	import Settings from '$lib/components/settings/Settings.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { settings, showSettings } from '$lib/stores/settings';
	import { OllamaFetch } from '$lib/tools/ollamaFetch';
	import '../styles/app.css';
	import '../styles/tailwind.css';
	import '../styles/snippets.css';
	import { engine } from '$lib/tools/engine';
	import { onMount } from 'svelte';
	import { DataBase, dbase } from '$lib/db/db';
	import { dbQuery } from '$lib/db/chatDb';

	// auto-load models
	async function modelS() {
		const ollamaFetcher = new OllamaFetch();
		const models = await ollamaFetcher.listModels();

		settings.setParameterValue('ollamaModels', [...models]);
		if (!$settings.defaultModel) settings.setParameterValue('defaultModel', models[0].name);
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
				activeChatId.set($page.params.id);
			} else {
				goto('/');
			}
		});
	}
</script>

<svelte:head>
	<title>wOOllama !</title>
</svelte:head>

<div class="flex w-full h-full overflow-hidden application">
	<div class="h-full overflow-hidden fixed z-50">
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
