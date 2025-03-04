<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import Speech from '$components/chat/input/Speech.svelte';
	import Input from './input/Input.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import ChatOptions from './ChatOptions.svelte';
	import { aiState } from '$lib/stores';
	import DashBoard from '$components/DashBoard.svelte';
	import { type ChatGenerate, chatParamsState } from '$lib/states/chat.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import MessagesList from './MessagesList.svelte';
	import { chatMetadata } from '$lib/tools/promptSystem';
	import { connectionTimer } from '$lib/stores/timer.svelte';
	import type { DBMessage } from '$types/db';
	import { WollamaApi } from '$lib/db/wollamaApi';
	import { get } from 'svelte/store';
	import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';
	import type { ChatRequest } from 'ollama/browser';
	import { ChatSessionManager } from '$lib/tools/chatSessionManager';
	import { OllamaChatMessageRole } from '$types/ollama';
	import { preventDefault } from 'svelte/legacy';

	interface MainChatProps {
		chatPassKey?: string;
	}

	let { chatPassKey }: MainChatProps = $props();

	let activeChatId: number | undefined       = $state();
	let chatSessionManager: ChatSessionManager = ChatSessionManager.loadSession();

	chatSessionManager.loadFromPathKey(chatPassKey).then((chat) => (activeChatId = chat?.id));

	let placeholder: string = $derived(
		chatParamsState.voiceListening ? 'Listening...' : 'Message to ai'
	);

	let disableSubmit: boolean = $derived(
		chatParamsState.prompt.trim() == '' || chatParamsState.isPrompting || $aiState == 'running'
	);

	async function sendPrompt(sessionManager: ChatSessionManager, chatParams: ChatGenerate) {
		const config        = get(settings);
		const ollamaOptions = get(ollamaApiMainOptionsParams);

		const { systemMessage, previousMessages, userChatMessage } = await sessionManager.buildMessages(
			chatParams,
			config
		);

		await sessionManager.createDbMessage(OllamaChatMessageRole.USER, userChatMessage);

		let assistantDbMessage: DBMessage | undefined;
		await Promise.all(
			chatParams.models.map(async (model: string) => {
				assistantDbMessage =
					assistantDbMessage ??
					(await sessionManager.createDbMessage(OllamaChatMessageRole.ASSISTANT, {
						status    : 'idle',
						role      : OllamaChatMessageRole.ASSISTANT,
						content   : '',
						model     : model,
						tool_calls: []
					}));

				const request: ChatRequest = {
					model   : model ?? config?.defaultModel,
					options : { ...ollamaOptions, temperature: chatParams.temperature },
					format  : chatParams.format,
					stream  : true,
					messages: [systemMessage, ...previousMessages, userChatMessage]
				} satisfies ChatRequest;

				const senderGenerate = await WollamaApi.chat(request);

				senderGenerate.onStream = (response) => {
					const target = assistantDbMessage;
					console.log('sender.onStream', { target, response });
					sessionManager.onMessageStream(assistantDbMessage, response);
					ui.setAutoScroll(target.chatId, false);
				};

				senderGenerate.onEnd = (response) => {
					sessionManager.onMessageDone(assistantDbMessage, response);
					aiState.set('done');
					chatMetadata.checkTitle(sessionManager.sessionId);
					// Log response to monitor message completion
					console.log('Response from assistant:', response);
				};
			})
		);

		ui.setAutoScroll(chatSessionManager?.sessionId, true);
	}

	async function submitHandler(chatParams: ChatGenerate) {
		if (!chatSessionManager.sessionId) {
			const session = await chatSessionManager.ChatSessionDB.createSession({
				models      : [...chatParams?.models],
				systemPrompt: chatParams.promptSystem
			});
			window.history.replaceState(history.state, '', `/chat/${session.dbChat.chatPassKey}`);
		} else {
			await chatSessionManager.ChatSessionDB.updateSession({
				models      : [...chatParams?.models],
				systemPrompt: chatParams.promptSystem
				/* ollamaBody: ollamaBodyStore, */
			});
		}
		activeChatId = chatSessionManager.sessionId;

		await sendPrompt(chatSessionManager, chatParams).catch((error) => {
			console.error('Error sending prompt:', error);
		});
	}

	function keyPressHandler(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitHandler($state.snapshot(chatParamsState));
			chatParamsState.images = undefined;
			chatParamsState.prompt = '';
		}
	}

	// retrieve model, temperature, format
	$effect(() => {
		chatParamsState.mode   = $settings.request_mode;
		chatParamsState.models = [$settings.defaultModel];
	});
</script>

{#snippet input()}
	<div class="application-chat-zone">
		<div class="input  ">
			<div class="inputTextarea flex flex-col gap-3 px-3 pt-3 flex-1">
				<!-- <Images />
                <hr /> -->
				<div class="flex justify-center absolute -top-10 left-0 w-full">
					<Speech
						onEnd={submitHandler}
						bind:prompt={chatParamsState.prompt}
						bind:voiceListening={chatParamsState.voiceListening}
					/>
				</div>
				<!-- <hr /> -->
				<div class="flex-1 relative">
					<Input
						disabled={!connectionTimer.connected}
						onkeypress={keyPressHandler}
						bind:value={chatParamsState.prompt}
						bind:requestStop={$aiState}
						{placeholder}
						form="prompt-form"
					/>
					<div
						class="absolute right-3 h-10 w-10 top-[50%] -mt-5 rounded-full place-content-center flex flex-col"
					>
						{#if $aiState == 'done'}
							<button
								class="rounded-full input   drop-shadow-lg aspect-square   items-center "
								type="submit"
								form="prompt-form"
							>
								<Icon icon="mdi:send" />
							</button>
						{:else}
							<button
								class="rounded-full border border drop-shadow-lg aspect-square flex place-content-center"
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
		<div class="text-xs text-center theme-bg p-2">{$t('ui.aiCautionMessage')}</div>
	</div>
{/snippet}
<!-- <div class="absolute right-4"><AgentPick /></div> -->
<form hidden id="prompt-form" onsubmit={(event)=>{
	event.preventDefault();
	submitHandler($state.snapshot(chatParamsState));
}} ></form>
<div class="h-full w-full">
	<div class="application-container flex-v h-full mx-auto">
		<DashBoard showList={Boolean(activeChatId)}>
			{#snippet home()}
				{@render input()}
			{/snippet}
			<MessagesList id={activeChatId} />
			{@render input()}
		</DashBoard>
	</div>
</div>

<style lang="postcss">
    @reference "../../styles/references.css";

    .inputTextarea {
        position: relative;

        &:has(textarea:focus) {
            border-color: var(--cfab-input-border-color-focus, red);
            border-radius: 0.5em;
        }
    }
</style>
