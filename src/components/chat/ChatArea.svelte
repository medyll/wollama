<script lang="ts">
	import { chatParametersState, type ChatParameters } from '$lib/states/chat.svelte';
	import { aiState } from '$lib/stores';
	import { connectionTimer } from '$lib/stores/timer.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import ChatOptions from './ChatOptions.svelte';
	import Images from './input/Images.svelte';
	import Speech from './input/Speech.svelte';
	import TextArea from './input/TextArea.svelte';
	import { ChatSessionManager } from '$lib/tools/chatSessionManager';
	import { settings } from '$lib/stores/settings.svelte';
	import { ui } from '$lib/stores/ui';
	import { WollamaApi } from '$lib/db/wollamaApi';
	import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
	import { chatMetadata } from '$lib/tools/promptSystem';
	import type { DBMessage } from '$types/db';
	import { OllamaChatMessageRole } from '$types/ollama';
	import type { ChatRequest } from 'ollama/browser';
	import { get } from 'svelte/store';

	interface Props {
		activeChatId: number | undefined;
		onChatLoaded: (id: number, chatPassKey?: string) => void;
		chatPassKey?: string;
		spaceId?:     number;
	}

	let { activeChatId = $bindable(), chatPassKey, onChatLoaded }: Props = $props();
	let placeholder: string = $derived(chatParametersState.voiceListening ? 'Listening...' : 'Message to ai');

	let chatSessionManager: ChatSessionManager = ChatSessionManager.loadSession();
	chatSessionManager.setParameters(chatParametersState);
	chatSessionManager
		.loadFromPathKey(chatPassKey)
		.then((chat) => {
			if (chat?.id) activeChatId = chat?.id;
			if (activeChatId && onChatLoaded) {
				onChatLoaded?.(activeChatId, chatPassKey);
			}
		})
		.catch((error) => {
			console.error('Error loading chat from path key:', error);
		});

	let disableSubmit: boolean = $derived(
		chatParametersState.prompt.trim() == '' || chatParametersState.isPrompting || $aiState == 'running'
	);

	$effect(() => {
		chatParametersState.mode = $settings.request_mode;
		chatParametersState.models = [$settings.defaultModel];
	});

	async function submitHandler(chatParams: ChatParameters) {
		if (!chatSessionManager.sessionId) {
			const session = await chatSessionManager.ChatSessionDB.createSession({
				models:       [...chatParams?.models],
				systemPrompt: chatParams.promptSystem
			});
			onChatLoaded?.(session.dbChat.id, session.dbChat.chatPassKey);
		} else {
			const session = await chatSessionManager.ChatSessionDB.updateSession({
				models:       [...chatParams?.models],
				systemPrompt: chatParams.promptSystem
			});
			onChatLoaded?.(session.dbChat.id, session.dbChat.chatPassKey);
		}
		activeChatId = chatSessionManager.sessionId;

		await sendPrompt(chatSessionManager, chatParams).catch((error) => {
			console.error('Error sending prompt:', error);
		});
	}

	function keyPressHandler(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitHandler($state.snapshot(chatParametersState));
			chatParametersState.images = undefined;
			chatParametersState.prompt = '';
		}
	}

	async function sendPrompt(sessionManager: ChatSessionManager, chatParams: ChatParameters) {
		const config = get(settings);
		const ollamaOptions = get(ollamaApiMainOptionsParams);

		const { systemMessage, previousMessages, userChatMessage } = await sessionManager.buildMessages(chatParams, config);

		let assistantDbMessage: DBMessage;
		aiState.set('running');
		await Promise.all(
			chatParams.models.map(async (model: string) => {
				assistantDbMessage =
					assistantDbMessage ??
					(await sessionManager.createDbMessage(OllamaChatMessageRole.ASSISTANT, {
						status:     'idle',
						role:       OllamaChatMessageRole.ASSISTANT,
						content:    '',
						model:      model,
						tool_calls: []
					}));

				const request: ChatRequest = {
					model:    model ?? config?.defaultModel,
					options:  { ...ollamaOptions, temperature: chatParams.temperature },
					format:   chatParams.format,
					stream:   true,
					messages: [systemMessage, ...previousMessages, userChatMessage]
				} satisfies ChatRequest;

				const senderGenerate = await WollamaApi.chat(request);

				senderGenerate.onStream = (response) => {
					const target = assistantDbMessage;
					sessionManager.onMessageStream(assistantDbMessage, response);
					ui.setAutoScroll(target.chatId, false);
				};

				senderGenerate.onEnd = (response) => {
					sessionManager.onMessageDone(assistantDbMessage);
					aiState.set('done');
					chatMetadata.checkTitle(sessionManager.sessionId);
				};
			})
		);

		ui.setAutoScroll(chatSessionManager?.sessionId, true);
	}
</script>

<form
	hidden
	id="prompt-form"
	onsubmit={(event) => {
		event.preventDefault();
		submitHandler($state.snapshot(chatParametersState));
	}}
></form>
<div class="application-chat-zone">
	<Images />
	<div class="application-chat-room">
		<div class="absolute -top-10 left-0 flex w-full justify-center">
			<Speech
				onEnd={submitHandler}
				bind:prompt={chatParametersState.prompt}
				bind:voiceListening={chatParametersState.voiceListening}
			/>
		</div>
		<!-- <hr /> -->
		<div class="relative flex-1">
			<TextArea
				disabled={!connectionTimer.connected}
				onkeypress={keyPressHandler}
				bind:value={chatParametersState.prompt}
				bind:requestStop={$aiState}
				{placeholder}
				form="prompt-form"
			/>
			<div class="absolute right-3 top-[50%] -mt-5 flex h-10 w-10 flex-col place-content-center rounded-full">
				{#if $aiState == 'done'}
					<button class="input aspect-square items-center rounded-full drop-shadow-lg" type="submit" form="prompt-form">
						<Icon icon="mdi:send" />
					</button>
				{:else}
					<button
						class="flex aspect-square place-content-center rounded-full border border drop-shadow-lg"
						form="prompt-form"
					>
						<Icon icon="mdi:stop" />
					</button>
				{/if}
			</div>
			<!-- <hr /> -->
		</div>
		<div class="flex">
			<ChatOptions />
			<div class="flex-1"></div>
		</div>
	</div>
</div>
<!--<div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>-->
