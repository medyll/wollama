<script lang="ts">
	import DashBoard from './DashBoard.svelte';
	import InputZone from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import Model from '$lib/components/Model.svelte';
	import { sendPrompt } from '$lib/promptSender';
	import {
		createChat,
		createMessage as createMessageData, 
	} from '$lib/tools/askOllama';
	import { messageList } from '../stores/messages';
	import { activeChatId, chatList } from '$lib/stores/chatList';
	import { settings } from '$lib/stores/settings';
	import { aiResponseState, chatEditListener } from '$lib/stores/chatEditListener';
	import Icon from '@iconify/svelte';
	import type { OllamaStreamLine } from '$lib/tools/ollamaFetch';

	let submitPrompt: Function;

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	 

	function getChat() {
		let chatId = $activeChatId ?? undefined;
		if (!$activeChatId) {
			const newChat = createChat({ models: [$settings.defaultModel] });
			chatId = newChat.id;
			// set ActiveId
			activeChatId.set(newChat.id);
			// add chat to store
			chatList.insertChat(newChat);
		}
		return chatId;
	}

	function sendMessage(chatId: string, content: string) {
		//
		const messageUser = createMessageData({ role: 'user', content, chatId });
		const messageAssistant = createMessageData({ role: 'assistant' });

		// add messages to store
		chatList.insertMessage($activeChatId, messageUser);
		chatList.insertMessage($activeChatId, messageAssistant);

		//
		chatList.getChatMessage($activeChatId, messageUser.id);

		// send prompt
		$aiResponseState = 'running';
		sendPrompt(content, async (data) => {
			postSendMessage($activeChatId, messageAssistant.id, messageUser.id, data);
		});
	}
	async function postSendMessage(
		chatId: string,
		assistantMessageId: number,
		userMessageId: any,
		data: OllamaStreamLine
	) {
		if (data.done) {
			console.log(data);
			streamResponseText = '';
			$aiResponseState = 'done';
			const content = Object.values(chatList.getChatMessages(chatId))[0];

			

			// update current user message with kpi and context
			chatList.updateChatMessage(chatId, {
				id: assistantMessageId,
				context: data.context
			});
		} else {
			streamResponseText += data.response ?? '';

			chatList.updateChatMessage(chatId, {
				id: assistantMessageId,
				content: streamResponseText
			});
		}
	}

	function preSendMessage(content: string) {
		const id = getChat();
		sendMessage(id, content);
		window.history.replaceState(history.state, '', `/chat/${id}`);
		prompt = '';
	}
</script>

<div class="flex flex-col h-full w-full overflow-auto relative">
	<Model />
	<div class="flex-1 mb-32">
		<DashBoard />
		<MessageList chatId={$activeChatId} />
	</div>
	<div class="w-full y-b fixed margb-0 max-w-3xl bottom-0">
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				preSendMessage(prompt);
			}}
		/>
		<div
			class="border flex place-items-center rounded-xl dark:bg-gray-800 dark:border-gray-100 dark:text-gray-100"
		>
			<textarea
				class="flex-1 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none py-3 px-2 resize-none"
				{placeholder}
				bind:value={prompt}
				on:keypress={(e) => {
					chatEditListener.setEvent();
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						preSendMessage(prompt);
					}
				}}
				rows="1"
				form="prompt-form"
			/>
			<div class="flex">
				<InputZone onEnd={preSendMessage} bind:prompt bind:voiceListening />
				<button type="submit" form="prompt-form" disabled={$chatEditListener.isTyping}>
					<Icon icon="mdi:send" style="font-size:1.8em" />
				</button>
			</div>
		</div>
		<div class="text-xs text-center">Caution message</div>
	</div>
</div>
