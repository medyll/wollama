<script lang="ts">
	import DashBoard from './DashBoard.svelte';
	import Speech from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import Model from '$lib/components/chat/Model.svelte';
	import { chatUtils } from '$lib/tools/chatUtils';
	import { activeChatId,  type ChatDataType } from '$lib/stores/chatter';
	import { aiResponseState, chatEditListener } from '$lib/stores/chatEditListener';
	import Icon from '@iconify/svelte';
	import Input from './chat/Input.svelte';
	import Attachment from './chat/Attachment.svelte';
	import ChatInfo from './chat/ChatInfo.svelte';
	import { t } from '$lib/i18n';
	import { ui } from '$lib/stores/ui';
	import Temperature from './chat/Temperature.svelte';
	import { PromptSender, type SenderCallback } from '$lib/tools/promptSender';
	import { dbQuery } from '$lib/db/dbQuery.js';
	import { prompter } from '$lib/stores/prompter';
	import { activeModels } from '$lib/stores';

	type CallbackDataType = {
		chatId: string;
		assistantData: any;
	};

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';
	let userFiles: any[] = [];

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	$: disableSubmit = prompt.trim() == '' || $chatEditListener.isTyping;

	async function getChatSession(): Promise<ChatDataType> {
		const chat = $ui.activeChatId &&  await dbQuery.getChat($ui.activeChatId as string)
			? await dbQuery.getChat($ui.activeChatId as string)
			: await dbQuery.insertChat();
 
			return chat;
	}

	// add messages to chat to db
	async function setChatSessionData(chatId: string, content: string) {
		// update chat parameters
		await dbQuery.updateChat(chatId, { temperature: $prompter.temperature, models: $activeModels });
		// insert user message
		await dbQuery.insertMessage(chatId, { role: 'user', content, chatId });
		// insert assistant message
		return await dbQuery.insertMessage(chatId, {
			role: 'assistant',
			chatId
		});
	}

	async function sendPrompt(prompt: string,args:any) {
		const chatSession = await getChatSession();
		const assistantData = await setChatSessionData(chatSession.chatId, prompt);

		chatSession.temperature = $prompter.temperature;

		const newSender = new PromptSender<CallbackDataType>(chatSession, {
			cb: postSendMessage,
			cbData: { chatId: chatSession.chatId, assistantData }
		});

		newSender.sendMessage(prompt);
		// set active chat
		ui.setActiveChatId(chatSession.chatId);
		// set auto-scroll to true
		ui.setAutoScroll(chatSession.chatId, true);
		$activeChatId = chatSession.chatId;
		// relocation without navigation
		window.history.replaceState(history.state, '', `/chat/${chatSession.chatId}`);
		// reset prompt
		prompt = '';
	}

	async function postSendMessage({
		chatId,
		assistantData,
		data
	}: SenderCallback<CallbackDataType>) {
		if (data.done) {
			streamResponseText = '';
			$aiResponseState = 'done';

			dbQuery.updateChat(chatId, { context: data.context });
			dbQuery.insertMessageStats({ ...data, messageId: assistantData.messageId });

			//
			chatUtils.checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			streamResponseText += data.response ?? '';

			dbQuery.updateMessage(assistantData.messageId, {
				content: streamResponseText
			});
		}
	}

	function keyPressHandler(e: KeyboardEvent) {
		$prompter.isPrompting = true;

		chatEditListener.setEvent(); // deprecated
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendPrompt(prompt,{temperature:$prompter.temperature});
		}
	}
</script>

<div class="flex-v h-full w-full overflow-auto relative">
	<div class="flex-1 mb-32">
		<DashBoard>
			<ChatInfo />
			<Model />
			<MessageList chatId={$ui.activeChatId} />
		</DashBoard>
	</div>
	<div>
		{#each userFiles as file, fileIdx}
			<img src={file.dataUri} alt="input" class="  " />
		{/each}
	</div>
	<div
		class="w-full y-b fixed margb-0 max-w-3xl bottom-0 backdrop-blur-xl theme-bg"
	>
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				sendPrompt(prompt);
			}}
		/>
		<Temperature />
		<!-- <div class="flex">
		<div class="ss">		
			<Temperature />
		</div>
		<Model /> 
		</div> -->
		<div class="inputTextarea">
			<Input on:keypress={keyPressHandler} bind:prompt {placeholder} form="prompt-form">
				<Attachment
					slot="start"
					form="prompt-form"
					bind:userFiles
					disabled={$chatEditListener.isTyping}
				/>
				<div slot="end" class="flex-align-middle">
					<Speech onEnd={sendPrompt} bind:prompt bind:voiceListening />
					<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
						<Icon icon="mdi:send" style="font-size:1.6em" />
					</button>
				</div>
			</Input>
		</div>
		<div class="text-xs text-center py-2">{$t('ui.aiCautionMessage')}</div>
	</div>
</div>
