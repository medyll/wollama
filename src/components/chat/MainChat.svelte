<script lang="ts">
	import Speech from '$components/chat/input/Speech.svelte';
	import Model from '$components/chat/input/Model.svelte';
	import { chatUtils } from '$lib/tools/chatUtils';
	import type { ChatType, MessageImageType, MessageType } from '$types/db';
	import Icon from '@iconify/svelte';
	import Input from './input/Input.svelte';
	import Attachment from './input/Attachment.svelte';
	import ChatInfo from './ChatInfo.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import ChatOptions from './input/ChatOptions.svelte';
	import { PromptSender, type SenderCallback } from '$lib/tools/promptSender';
	import { idbQuery } from '$lib/db/dbQuery.js';
	import { prompter, type PrompterType } from '$lib/stores/prompter';
	import { aiState } from '$lib/stores';
	import Message from '$components/chat/Message.svelte';
	import DashBoard from '$components/DashBoard.svelte';
	import Images from './input/Images.svelte';
	import List from '$components/fragments/List.svelte';
	import { liveQuery } from 'dexie';
	import Bottomer from '$components/ui/Bottomer.svelte';
	import { ollamaParams } from '$lib/stores/ollamaParams';

	type CallbackDataType = {
		chatId: string;
		assistantData: MessageType;
	};

	$: placeholder = $prompter.voiceListening ? 'Listening...' : 'Message to ai';

	$: disableSubmit =
		$prompter.ollamaBody.prompt.trim() == '' || $prompter.isPrompting || $aiState == 'running';

	$: messages = liveQuery(() => ($ui.activeChatId ? idbQuery.getMessages($ui.activeChatId) : []));

	// add messages chat to db
	async function createMessages(chat: ChatType, content: string, images?: MessageImageType) {
		const ty = await idbQuery.insertMessage(chat.chatId, {
			role: 'user',
			status: 'done',
			content,
			chatId: chat.chatId,
			images: images
		});

		const ay = await Promise.all([
			...chat.models.map(
				async (model) =>
					await idbQuery.insertMessage(chat.chatId, {
						role: 'assistant',
						status: 'idle',
						chatId: chat.chatId,
						model
					})
			)
		]);
		// insert assistant message
		return {
			userData: ty,
			assistantModelData: ay
		};
	}

	async function sendPrompt(prompter: PrompterType) {
		const { ollamaBody, images } = prompter; // clear reference

		// retrieve or set a chat session
		const chatSession = await idbQuery.initChat($ui.activeChatId, {
			models: prompter.models,
			ollamaBody: prompter.ollamaBody
		} as ChatType);

		// set default options
		ollamaBody.options = { ...$ollamaParams, ...ollamaBody.options };
		ollamaBody.images = images?.base64 ? [images?.base64] : [];
		ollamaBody.format = ollamaBody.format?.replace('plain', '');
		ollamaBody.context = chatSession.context ?? [];

		// create messages for chat session
		const sessionMessages = await createMessages(chatSession, ollamaBody.prompt as string, images);

		// set ai state to running
		aiState.set('running');
		// create prompt sender for each model
		sessionMessages.assistantModelData.forEach(async (assistantMessage) => {
			const sender = new PromptSender<CallbackDataType>(
				{ ...ollamaBody, model: assistantMessage.model },
				{
					cb: onResponseMessage,
					cbData: {
						chatId: assistantMessage.chatId,
						assistantData: assistantMessage
					}
				}
			);

			// send prompt to ai
			sender.sendMessage();
		});

		// set active chat
		ui.setActiveChatId(chatSession.chatId);
		// set auto-scroll to true
		ui.setAutoScroll(chatSession.chatId, true);
		// relocation without navigation
		window.history.replaceState(history.state, '', `/chat/${chatSession.chatId}`);
	}

	async function onResponseMessage({
		chatId,
		assistantData: assistantMessage,
		data
	}: SenderCallback<CallbackDataType>) {
		if (data.done) {
			aiState.set('done');

			idbQuery.updateChat(chatId, { context: data.context });
			idbQuery.updateMessage(assistantMessage.messageId, { status: 'done' });
			idbQuery.insertMessageStats({ ...data, messageId: assistantMessage.messageId });
			//
			chatUtils.checkTitle(chatId);
			// set auto-scroll to false
			ui.setAutoScroll(chatId, false);
		} else {
			const message = await idbQuery.getMessage(assistantMessage.messageId);
			idbQuery.updateMessage(assistantMessage.messageId, {
				content: (message?.content ?? '') + (data.response ?? ''),
				status: 'streaming'
			});
		}
	}

	function submitHandler() {
		sendPrompt($prompter);
		//prompter.reset();
	}

	function keyPressHandler(e: KeyboardEvent) {
		$prompter.isPrompting = true;

		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitHandler();
		}
	}
</script>

<form hidden id="prompt-form" on:submit|preventDefault={submitHandler} />
<div class="h-full w-full overflow-auto">
	<div class="container flex-v h-full mx-auto">
		<DashBoard>
			<ChatInfo>
				<Model bind:activeModels={$prompter.models} />
			</ChatInfo>
			<List class="flex-v w-full gap-4" data={$messages} let:item={message}>
				<Message {message} />
				<hr class="mx-auto w-64" />
			</List>
			<Bottomer />
		</DashBoard>
		<div class="flex flex-col w-full y-b sticky margb-0 bottom-0 px-8">
			<ChatOptions />
			<div class="inputTextarea">
				<Images />
				<Input
					on:keypress={keyPressHandler}
					bind:value={$prompter.ollamaBody.prompt}
					bind:requestStop={$aiState}
					showCancel={$aiState == 'running'}
					{placeholder}
					form="prompt-form"
				>
					<Attachment
						slot="start"
						form="prompt-form"
						bind:imageFile={$prompter.images}
						disabled={false}
					/>
					<div slot="end" class="flex-align-middle">
						<Speech
							onEnd={submitHandler}
							bind:prompt={$prompter.ollamaBody.prompt}
							bind:voiceListening={$prompter.voiceListening}
							disabled={disableSubmit}
						/>
						<button class="px-2" type="submit" form="prompt-form" disabled={disableSubmit}>
							<Icon icon="mdi:send" style="font-size:1.6em" />
						</button>
					</div>
				</Input>
			</div>
			<div class="text-xs text-center theme-bg pb-1">{$t('ui.aiCautionMessage')}</div>
		</div>
	</div>
</div>
