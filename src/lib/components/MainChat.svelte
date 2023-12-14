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
	import { checkTitle } from '$lib/tools/utils';
	import ChatInfo from './chat/ChatInfo.svelte';
	import { t } from '$lib/i18n';
	import { ui } from '$lib/stores/ui';
	import Temperature from './chat/Temperature.svelte';

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
		const chat = chatter.getChat(chatId);
		//
		const messageUser = chatDataObject.createMessageData({ role: 'user', content, chatId });
		const messageAssistant = chatDataObject.createMessageData({ role: 'assistant' });

		// add messages to store
		chatter.insertMessage(chatId, messageUser);
		chatter.insertMessage(chatId, messageAssistant);

		$aiResponseState = 'running';

		let args = { prompt: content, context: chat?.context ?? [] };
		// use args as a parameter
		sendPrompt(args, async (data) =>
			postSendMessage(chatId, messageAssistant.id, messageUser.id, data)
		);
	}

	async function postSendMessage(
		chatId: string,
		assistantMessageId: string,
		userMessageId: any,
		data: OllamaStreamLine
	) {
		if (data.done) {
			streamResponseText = '';
			$aiResponseState = 'done';

			// register chat context
			chatter.updateChat(chatId, { context: data.context });
			// update chat assistant message data
			chatter.updateChatMessageData(chatId, assistantMessageId, data);
			//
			checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			streamResponseText += data.response ?? '';

			chatter.updateChatMessage(chatId, {
				id: assistantMessageId,
				content: streamResponseText
			});
		}
	}

	function preSendMessage(content: string) {
		const id = getChat() as string;
		sendMessage(id, content);
		window.history.replaceState(history.state, '', `/chat/${id}`);
		// reset prompt
		prompt = '';
		// set auto-scroll to true
		ui.setAutoScroll(id, true);
	}

	function keyPressHandler(e: KeyboardEvent) {
		chatEditListener.setEvent();
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			preSendMessage(prompt);
		}
	}
</script>

<div class="flex-v h-full w-full overflow-auto relative">
	<div class="flex-1 mb-32">
		<DashBoard>
			<ChatInfo />
			<Model />
			<MessageList chatId={$activeChatId} />
		</DashBoard>
	</div>
	<div>
		{#each userFiles as file, fileIdx}
			<img src={file.dataUri} alt="input" class="  " />
		{/each}
	</div>
	<div
		class="w-full y-b fixed margb-0 max-w-3xl bottom-0 backdrop-blur-xl bg-white/90 dark:bg-gray-500/50"
	>
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				preSendMessage(prompt);
			}}
		/>
		<div  >
			<Temperature />
		</div>
		<div class="mainInputArea">
			<Input on:keypress={keyPressHandler} bind:prompt {placeholder} form="prompt-form">
				<Attachment
					slot="start"
					form="prompt-form"
					bind:userFiles
					disabled={$chatEditListener.isTyping}
				/>
				<div slot="end" class="flex-align-middle">
					<Speech onEnd={preSendMessage} bind:prompt bind:voiceListening />
					<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
						<Icon icon="mdi:send" style="font-size:1.6em" />
					</button>
				</div>
			</Input>
		</div>
		<div class="text-xs text-center py-2">{$t('ui.aiCautionMessage')}</div>
	</div>
</div>
