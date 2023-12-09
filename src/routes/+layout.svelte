<script lang="ts">
	import MainChat from '$lib/components/MainChat.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import type { MessageListType, MessageType } from '$lib/stores/messages';
	import { settings } from '$lib/stores/settings';
	import { guessChatTitle } from '$lib/tools/askOllama';
	import { OllamaFetch } from '$lib/tools/ollamaFetch';
	import '../styles/app.css';
	import '../styles/tailwind.css';

	function setSettings() {
		// set default model
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

	async function checkTitle(chatId: string) {
		const chat = chatter.getChat(chatId);
		if (chat?.title === 'New Chat') {
			const chat = chatter.getChat(chatId);
			const messages: MessageListType = chat.messages;

			if (chat.title == 'New Chat' && Object.values(messages).length > 1) {
				const resume = Object.values(messages)
					.slice(0, 2)
					.map((message: MessageType) => message.content)
					.join('\n');
				
			const res = await guessChatTitle(resume);
			
			// 
			if (res?.response !== '') chatter.updateChat(chatId, { title: res.response });

			}
		}
	}

	/* chatter.subscribe((n) => {
		if ($activeChatId) checkTitle($activeChatId);
	});

	activeChatId.subscribe((n) => {
		if (n) checkTitle(n);
	}); */

	modelS();
</script>

<svelte:head>
	<title>AIUI</title>
</svelte:head>

<div
	class="flex w-full h-full text-gray-700
bg-white
dark:bg-gray-800 dark:text-gray-100
overflow-hidden"
>
	<div class="h-full overflow-hidden">
		<Sidebar />
	</div>
	<div class="flex-1 relative overflow-auto">
		<div class="flex flex-col flex-1 h-full">
			<div class="relative"><Navbar /></div>
			<div class="flex-1 w-full relative">
				<div class="h-full relative overflow-hidden mx-auto max-w-3xl">
					<slot><MainChat /></slot>
				</div>
			</div>
		</div>
	</div>
</div>
