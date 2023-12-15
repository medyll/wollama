<script lang="ts">
	import DashBoard from './DashBoard.svelte';
	import Speech from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import Model from '$lib/components/chat/Model.svelte';
	import { chatUtils } from '$lib/tools/chatUtils';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { settings } from '$lib/stores/settings';
	import { aiResponseState, chatEditListener } from '$lib/stores/chatEditListener';
	import Icon from '@iconify/svelte';
	import Input from './chat/Input.svelte';
	import Attachment from './chat/Attachment.svelte';
	import ChatInfo from './chat/ChatInfo.svelte';
	import { t } from '$lib/i18n';
	import { ui } from '$lib/stores/ui';
	import Temperature from './chat/Temperature.svelte';
	import { chatSender, type chatSenderMessageCB } from '$lib/tools/chatSender';
	import { onMount } from 'svelte'; 
	import { chatDB } from '$lib/db/chatDb.js'

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';
	let userFiles: any[] = [];

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	onMount(async () => {
		// console.log(await chatStore.getChats());
	});

	$: disableSubmit = prompt.trim() == '' || $chatEditListener.isTyping;

	async function preSendMessage(content: string) {
		const chat = (await chatSender.initChat())  ;
		chatSender.sendMessage(content, postSendMessage);
		// relocation without navigation
		window.history.replaceState(history.state, '', `/chat/${chat.chatId}`);
		// reset prompt
		prompt = '';
		// set auto-scroll to true
		ui.setAutoScroll(chat.chatId, true);
	}

	async function postSendMessage({ chatId, assistantMessageId, data }: chatSenderMessageCB) {
		if (data.done) {
			streamResponseText = '';
			$aiResponseState = 'done';

			chatDB.updateChat(chatId, { context: data.context });
			chatDB.insertMessageStats({ ...data, messageId: assistantMessageId });

			// delete bellow
			// register chat context
			chatter.updateChat(chatId, { context: data.context });
			// update chat assistant message data
			chatter.updateChatMessageData(chatId, assistantMessageId, data);
			//
			chatUtils.checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			streamResponseText += data.response ?? '';

			chatDB.updateMessage(assistantMessageId, {
				content: streamResponseText
			});

			// delete below
			chatter.updateChatMessage(chatId, {
				id: assistantMessageId,
				content: streamResponseText
			});
		}
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
		<div>
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
