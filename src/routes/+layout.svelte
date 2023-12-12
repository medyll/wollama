<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import MainChat from '$lib/components/MainChat.svelte';
	import Settings from '$lib/components/settings/Settings.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import type { MessageListType, MessageType } from '$lib/stores/messages';
	import { settings, showSettings } from '$lib/stores/settings';
	import { guessChatTitle } from '$lib/tools/askOllama';
	import { OllamaFetch } from '$lib/tools/ollamaFetch';
	import '../styles/app.css';
	import '../styles/tailwind.css';
	import '../styles/snippets.css';
	import { engine } from '$lib/tools/engine';
	import { ui } from '$lib/stores/ui';

	function setSettings() {
		
	}
	// auto-load models
	async function modelS() {
		const ollamaFetcher = new OllamaFetch();
		const models = await ollamaFetcher.listModels();

		settings.update((n) => ({
			...n,
			['models']: [...models]
		}));
	}

	engine.checkOllamaEndPoints();

	modelS();

	if ($page.params.id) {
		if (!chatter.getChat($page.params.id)) {
			$activeChatId = undefined;
			goto('/');
		} else {
			activeChatId.set($page.params.id);
		}
	}
</script>

<svelte:head>
	<title>AIUI</title>
</svelte:head>

<div class="flex w-full h-full overflow-hidden application">
	<div class="h-full overflow-hidden">
		<Sidebar />
	</div>
	<div class="flex-1 relative overflow-auto">
		<div class="flex-v flex-1 h-full">
			<div class="relative"><Navbar /></div>
			<div class="flex-1 w-full relative">
				<div class="h-full relative overflow-hidden mx-auto max-w-3xl">
					<slot><MainChat /></slot>
				</div>
			</div>
		</div>
	</div>
</div>
<Modal show={$showSettings}>
	<Settings />
</Modal>
