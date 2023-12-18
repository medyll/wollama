<script lang="ts">
	import Speech from '$components/chat/input/Speech.svelte';
	import MessageList from '$components/chat/messages/MessageList.svelte';
	import Model from '$components/chat/input/Model.svelte';
	import { chatUtils } from '$lib/tools/chatUtils';
	import type { ChatType, MessageImageType, MessageType } from '$types/db';
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
	import { activeModels, aiState } from '$lib/stores';
	import Message from '$components/chat/messages/Message.svelte';
	import { settings } from '$lib/stores/settings';
	import DashBoard from '$components/DashBoard.svelte';
	import Images from './input/Images.svelte';

	type CallbackDataType = {
		chatId: string;
		assistantData: MessageType;
	};

	let voiceListening = false;

	let streamResponseText: string = '';

	let placeholder = voiceListening ? 'Listening...' : 'Message to ai';

	$: disableSubmit =
		$prompter.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running';

	async function getChatSession(args: Partial<ChatType>): Promise<ChatType> {
		const chat =
			Boolean($ui.activeChatId) && Boolean(await dbQuery.getChat($ui.activeChatId as string))
				? await dbQuery.getChat($ui.activeChatId as string)
				: await dbQuery.insertChat();

		// update chat parameters
		await dbQuery.updateChat(chat.chatId, {
			models: args.models,
			options: { ...args.options }
		});

		return chat as ChatType;
	}

	// add messages chat to db
	async function createChatSessionMessages(
		chat: ChatType,
		content: string,
		images: MessageImageType[] = []
	) {
		const ty = await Promise.all([
			// insert user message
			await dbQuery.insertMessage(chat.chatId, {
				role: 'user',
				status: 'done',
				content,
				chatId: chat.chatId,
				images
			}),
			// insert assistant message
			await dbQuery.insertMessage(chat.chatId, {
				role: 'assistant',
				status: 'sent',
				chatId: chat.chatId,
				model: chat.models[0]
			})
		]).then((res) => res);

		// insert assistant message
		return {
			userData: ty[0],
			assistantData: ty[1]
		};
	}

	async function sendPrompt(prompter: PrompterType) {
		const { prompt, options, images } = prompter; // clear reference

		// retrieve or set a chat session
		const chatSession = await getChatSession({
			models: $activeModels,
			options: { ...prompter.options }
		});

		const sessionMessages = await createChatSessionMessages(chatSession, prompt, images);

		// set chat options for ollama call
		chatSession.options = { ...$settings.llamaOptions, ...options };

		const sender = new PromptSender<CallbackDataType>(chatSession, {
			images: images?.map((n) => n.header + ',' + n.base64),
			cb: onResponseMessage,
			cbData: {
				chatId: chatSession.chatId,
				assistantData: sessionMessages.assistantData
			}
		});
		// set ai state to running
		aiState.set('running');
		// send prompt to ai
		sender.sendMessage(prompt);
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
			aiState.set('done');

			dbQuery.updateChat(chatId, { context: data.context });
			dbQuery.updateMessage(assistantData.messageId, { status: 'done' });
			dbQuery.insertMessageStats({ ...data, messageId: assistantData.messageId });
			//
			chatUtils.checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			streamResponseText += data.response ?? '';
			// fire scroll position
			dbQuery.updateMessage(assistantData.messageId, {
				content: streamResponseText,
				status: 'streaming'
			});
		}
	}

	function submitHandler() {
		sendPrompt($prompter);
		prompter.reset();
	}

	function keyPressHandler(e: KeyboardEvent) {
		$prompter.isPrompting = true;

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitHandler();
		}
	}
</script>

<div
	class="flex-v h-full mx-auto relative md:max-w-3xl lg:max-w-[40rem] xl:max-w-[50rem] 2xl:max-w-[120-rem]"
>
		<Model />
	<div class="flex-1 mb-32 px-8">
		<DashBoard>
			<ChatInfo></ChatInfo>
			<MessageList chatId={$ui.activeChatId} let:message>
				<Message {message} />
			</MessageList>
		</DashBoard>
	</div>
	<div class="w-full y-b sticky margb-0 bottom-0 px-8 backdrop-blur-xl theme-bg">
		<form id="prompt-form" on:submit|preventDefault={submitHandler} />
		<Temperature />
		<Images />
		<div class="inputTextarea">
			<Input
				on:keypress={keyPressHandler}
				bind:value={$prompter.prompt}
				bind:requestStop={$aiState}
				showCancel={$aiState == 'running'}
				{placeholder}
				form="prompt-form"
			>
				<Attachment
					slot="start"
					form="prompt-form"
					bind:userFiles={$prompter.images}
					disabled={false}
				/>
				<div slot="end" class="flex-align-middle">
					<Speech
						onEnd={submitHandler}
						bind:prompt={$prompter.prompt}
						bind:voiceListening
						disabled={disableSubmit}
					/>
					<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
						<Icon icon="mdi:send" style="font-size:1.6em" />
					</button>
				</div>
			</Input>
		</div>
		<div class="text-xs text-center py-2">{$t('ui.aiCautionMessage')}</div>
	</div>
</div>
