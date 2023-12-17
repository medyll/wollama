<script lang="ts">

	import Speech from '$components/chat/input/Speech.svelte';
	import MessageList from '$components/chat/messages/MessageList.svelte';
	import Model from '$components/chat/input/Model.svelte';
	import { chatUtils } from '$lib/tools/chatUtils';
	import type {  ChatType } from '$types/db';
	import Icon from '@iconify/svelte';
	import Input from './input/Input.svelte';
	import Attachment from './input/Attachment.svelte';
	import ChatInfo from './ChatInfo.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import Temperature from './input/Temperature.svelte';
	import { PromptSender, type SenderCallback } from '$lib/tools/promptSender';
	import { dbQuery } from '$lib/db/dbQuery.js';
	import { prompter, type PrompterType } from '$lib/stores/prompter';
	import { activeModels,  aiState } from '$lib/stores';
	import Message from '$components/chat/messages/Message.svelte'; 
	import { settings} from '$lib/stores/settings';
	import DashBoard from '$components/DashBoard.svelte';

	type CallbackDataType = {
		chatId: string;
		assistantData: any;
	};

	let voiceListening = false;

	let streamResponseText: string = '';
	let userFiles: any[] = [];

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	$: disableSubmit = $prompter.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running';

	async function getChatSession(): Promise<ChatType> {
		const chat = $ui.activeChatId &&  await dbQuery.getChat($ui.activeChatId as string)
			? await dbQuery.getChat($ui.activeChatId as string)
			: await dbQuery.insertChat();
 
			return chat;
	}

	// add messages to chat to db
	async function setChatSessionData(chatId: string, content: string) {
		// update chat parameters
		await dbQuery.updateChat(chatId, { 
			models: $activeModels, 
			options:{
				...$prompter.options, 
			} });
		// insert user message
		await dbQuery.insertMessage(chatId, { role: 'user', content, chatId });
		// insert assistant message
		return await dbQuery.insertMessage(chatId, {
			role: 'assistant',
			chatId
		});
	}

	async function sendPrompt(prompter: PrompterType) {
		const chatSession = await getChatSession();
		const assistantData = await setChatSessionData(chatSession.chatId, prompter.prompt);

		// set chat options for ollama call
		chatSession.options = { ...$settings.llamaOptions,...prompter.options};

		const sender = new PromptSender<CallbackDataType>(chatSession, 
														{  
															cb: onResponseMessage,
															cbData: { chatId: chatSession.chatId, assistantData }
														});
		// set ai state to running
		aiState.set('running');
		// send prompt to ai
		sender.sendMessage(prompter.prompt);
		// set active chat
		ui.setActiveChatId(chatSession.chatId);
		// set auto-scroll to true
		ui.setAutoScroll(chatSession.chatId, true);
		// relocation without navigation
		window.history.replaceState(history.state, '', `/chat/${chatSession.chatId}`);
	}

	async function onResponseMessage({
		chatId,
		assistantData,
		data
	}: SenderCallback<CallbackDataType>) {
		if (data.done) {
			streamResponseText = '';
			$aiState = 'done';

			dbQuery.updateChat(chatId, { context: data.context });
			dbQuery.insertMessageStats({ ...data, messageId: assistantData.messageId }); 

			//
			chatUtils.checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			streamResponseText += data.response ?? '';
			// fire scroll position
			dbQuery.updateMessage(assistantData.messageId, {
				content: streamResponseText
			});
		}
	}

	function keyPressHandler(e: KeyboardEvent) {
		$prompter.isPrompting = true;
 		$prompter.prompt = e.target?.value;

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendPrompt($prompter);
 			$prompter.prompt = '';
		}
	}
</script>

<div class="flex-v h-full w-full overflow-auto relative">
	<div class="flex-1 mb-32">
		<DashBoard>
			<ChatInfo >			
			<Model />
			</ChatInfo> 
			<MessageList chatId={$ui.activeChatId} let:message >
				<hr class="w-16" />
				<Message {message} />
			</MessageList>
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
				sendPrompt($prompter);
			}}
		/>
		<Temperature />
		<div class="inputTextarea">
			<Input 
			on:keypress={keyPressHandler} 
			bind:value={$prompter.prompt} 
			{placeholder} form="prompt-form">
				<Attachment
					slot="start"
					form="prompt-form"
					bind:userFiles
					disabled={false}
				/>
				<div slot="end" class="flex-align-middle">
					<Speech onEnd={sendPrompt} bind:prompt={$prompter.prompt} bind:voiceListening  disabled={disableSubmit}/>
					<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
						<Icon icon="mdi:send" style="font-size:1.6em" />
					</button>
				</div>
			</Input>
		</div>
		<div class="text-xs text-center py-2">{$t('ui.aiCautionMessage')}</div>
	</div>
</div>
