<script lang="ts">
	import InputZone from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import Model from '$lib/components/Model.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { sendPrompt } from '$lib/promptSender';
	import { createChat, createMessage, guessChatTitle } from '$lib/tools/askOllama';
	import { messageList } from '../stores/messages';
	import { activeChatId, chatList } from '$lib/stores/chatList';

	let submitPrompt: Function;

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';

	$: if ($activeChatId && Object.values($messageList ?? {}).length > 1) {
		window.history.replaceState(history.state, '', `/chat/${$activeChatId}`);
	}

	$: if (
		$activeChatId &&
		$chatList[$activeChatId]?.title === 'New Chat' &&
		Object.entries($chatList[$activeChatId]?.messages).length === 2
	) { 
		// concat the 2 first messages
		const content = Object.values(chatList.getChatMessages($activeChatId))[0];
		/* guessChatTitle(content).then((res)=>{
			console.log(res)
		}); */
	}

	function sendRequest(content: string) {
		let chatId = $activeChatId ?? undefined;
		// if no active chatId, create new chat
		if (!$activeChatId) {
			const newChat = createChat();
			chatId = newChat.id;
			// set ActiveId
			activeChatId.set(newChat.id);
			// add chat to store
			chatList.setChat(newChat);
		}
		//
		const message = createMessage({ role: 'user', content });
		const messageAssistant = createMessage({ role: 'assistant', parentId: message.id });

		// add message to list
		chatList.createChatMessage($activeChatId, message);
		chatList.createChatMessage($activeChatId, messageAssistant);

		//
		chatList.getChatMessage($activeChatId,message.id); 
		// send prompt
		sendPrompt(content, (content, done) => {
			if (done) {
				streamResponseText = '';
				return;
			}

			streamResponseText += content ?? '';

			chatList.updateChatMessage($activeChatId, {
				id: messageAssistant.id,
				content: streamResponseText
			});
		});
	}
</script>

<div class="flex flex-col h-full w-full overflow-auto relative">
	<Model />
	<div class="flex-1 mb-32">
		<MessageList chatId={$activeChatId} />
	</div>
	<div class="w-full y-b fixed margb-0 max-w-3xl bottom-0">
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				submitPrompt(prompt);
			}}
		/>
		<div
			class="flex place-items-center rounded-xl dark:bg-gray-800 dark:border-gray-100 dark:text-gray-100"
		>
			<textarea
				class="flex-1 border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none py-3 px-2 resize-none"
				placeholder={voiceListening ? 'Listening...' : 'Write a message'}
				disabled={voiceListening}
				bind:value={prompt}
				on:keypress={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						sendRequest(prompt);
					}
				}}
				rows="1"
				form="prompt-form"
			/>
			<div>
				<InputZone onEnd={sendRequest} bind:prompt bind:voiceListening />
			</div>
		</div>
		<div class="text-xs text-center">Caution message</div>
	</div>
</div>
