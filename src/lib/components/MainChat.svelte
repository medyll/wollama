<script lang="ts">
	import DashBoard from './DashBoard.svelte';
	import Speech from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import Model from '$lib/components/chat/Model.svelte';
	import { sendPrompt } from '$lib/promptSender';
	import { chatDataObject } from '$lib/tools/askOllama';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { settings } from '$lib/stores/settings';
	import { aiResponseState, chatEditListener } from '$lib/stores/chatEditListener';
	import Icon from '@iconify/svelte';
	import type { OllamaStreamLine } from '$lib/tools/ollamaFetch';
	import Input from './chat/Input.svelte';
	import Attachment from './chat/Attachment.svelte';

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';
	let userFiles: any[] = [];

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	$: disableSubmit = prompt.trim() == '' || $chatEditListener.isTyping;

	function getChat() {
		let chatId = $activeChatId ?? undefined;
		if (!$activeChatId) {
			const newChat = chatDataObject.createChatData({ models: [$settings.defaultModel] });
			chatId = newChat.id;
			// set ActiveId
			activeChatId.set(newChat.id);
			// add chat to store
			chatter.insertChat(newChat);
		}
		return chatId;
	}

	function sendMessage(chatId: string, content: string) {
		//
		const messageUser = chatDataObject.createMessageData({ role: 'user', content, chatId });
		const messageAssistant = chatDataObject.createMessageData({ role: 'assistant' });

		console.log({ messageUser, messageAssistant });
		// add messages to store
		chatter.insertMessage($activeChatId, messageUser);
		chatter.insertMessage($activeChatId, messageAssistant);

		//
		// chatter.getChatMessage($activeChatId, messageUser.id);

		// send prompt
		$aiResponseState = 'running';
		sendPrompt(content, async (data) => postSendMessage($activeChatId, messageAssistant.id, messageUser.id, data));
	}

	async function postSendMessage(
		chatId: string,
		assistantMessageId: number,
		userMessageId: any,
		data: OllamaStreamLine
	) {
		if (data.done) {
			streamResponseText = '';
			$aiResponseState = 'done';
			const content = Object.values(chatter.getChatMessages(chatId))[0];

			// update current user message with kpi and context
			chatter.updateChatMessage(chatId, {
				id: assistantMessageId,
				context: data.context
			});
		} else {
			streamResponseText += data.response ?? '';

			chatter.updateChatMessage(chatId, {
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

	function keyPressHandler(e: KeyboardEvent) {
		chatEditListener.setEvent();
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			preSendMessage(prompt);
		}
	}
</script>

<div class="flex flex-col h-full w-full overflow-auto relative">
	<Model />
	$aiResponseState {$aiResponseState}
	<div class="flex-1 mb-32">
		<DashBoard>
			<MessageList chatId={$activeChatId} />
		</DashBoard>
	</div>
	<div>
		{#each userFiles as file, fileIdx}
			<img src={file.dataUri} alt="input" class="  " />
		{/each}
	</div>
	<div class="w-full y-b fixed margb-0 max-w-3xl bottom-0">
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				preSendMessage(prompt);
			}}
		/>
		<div class="textarea">
			<Input on:keypress={keyPressHandler} bind:prompt {placeholder} form="prompt-form">
				<Attachment
					slot="start"
					form="prompt-form"
					bind:userFiles
					disabled={$chatEditListener.isTyping}
				/>
				<div slot="end" class="flex items-center">
					<Speech onEnd={preSendMessage} bind:prompt bind:voiceListening />
					<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
						<Icon icon="mdi:send" style="font-size:1.6em" />
					</button>
				</div>
			</Input>
		</div>
		<div class="text-xs text-center py-2">Caution message</div>
	</div>
</div>

<style lang="postcss">
	.textarea {
		@apply border overflow-hidden rounded-xl dark:bg-gray-800 border-gray-400 dark:border-gray-100 dark:text-gray-100;
	}
</style>
