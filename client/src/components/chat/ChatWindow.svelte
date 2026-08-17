<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { connectionState } from '$lib/state/connection.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { audioService } from '$lib/services/audio.service';
	import { chatService } from '$lib/services/chat.service';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { parseMarkdown } from '$lib/utils/markdown';
	import CompanionSelector from '$components/ui/CompanionSelector.svelte';
	import MessageActions from '$components/chat/MessageActions.svelte';
	import ThinkingMessage from '$components/chat/ThinkingMessage.svelte';
	import ChatInput from '$components/chat/ChatInput.svelte';
	import ToolCallMessage from '$components/chat/tool-call-message.svelte';
	import RunTimeline from '$lib/components/tool/RunTimeline.svelte';
	import { runStore } from '$lib/services/run.service.svelte.js';
	import Icon from '@iconify/svelte';
	import type { Companion, UserCompanion } from '$types/data';
	import { goto } from '$app/navigation';

	type ActiveCompanion = Companion | UserCompanion;

	let { chatId = $bindable(undefined), initialCompanionId = undefined } = $props();

	// Placeholder for chat logic
	let messageInput = $state('');
	let isCompagnonModalOpen = $state(false);
	let isRecording = $state(false);
	let selectedFiles = $state<string[]>([]);

	let currentCompagnon: ActiveCompanion = $state({
		user_companion_id: '1',
		user_id: userState.uid || '',
		name: t('ui.general_assistant'),
		model: userState.preferences.defaultModel,
		system_prompt: 'You are a helpful assistant.',
		created_at: Date.now()
	});

	let messages = $state<any[]>([]);
	let visibleMessages = $derived(messages.filter((message) => message.role !== 'system'));
	// Runs (M4/M5): supervised agent_start calls for this chat, kept fresh by
	// run.service.svelte.ts's REST polling — see that file for why RxDB isn't used here.
	let activeRunsForChat = $derived(Object.values(runStore.runs).filter((run) => run.chat_id === chatId));
	let chatContainer = $state<HTMLDivElement>();
	let userHasScrolledUp = $state(false);
	let availableModels = $state<string[]>([]);

	function getCompanionId(companion: ActiveCompanion): string {
		return 'user_companion_id' in companion ? companion.user_companion_id : companion.companion_id;
	}

	async function getCompanionById(companionId: string): Promise<ActiveCompanion | null> {
		const userCompanionService = new DataGenericService<UserCompanion>('user_companions');
		const userCompanion = await userCompanionService.get(companionId);
		if (userCompanion) return userCompanion;

		const companionService = new DataGenericService<Companion>('companions');
		return companionService.get(companionId);
	}

	async function loadAvailableModels() {
		try {
			const serverUrl = userState.preferences.serverUrl.replace(/\/$/, '');
			const response = await fetch(`${serverUrl}/api/models`);
			if (!response.ok) return;

			const data = (await response.json()) as { models?: Array<string | { name?: string }> };
			availableModels = (data.models || [])
				.map((model) => (typeof model === 'string' ? model : model.name || ''))
				.filter(Boolean);
		} catch (error) {
			console.warn('Could not load Ollama models:', error);
		}
	}

	$effect(() => {
		if (connectionState.isConnected) void loadAvailableModels();
	});

	function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
		if (chatContainer) {
			// Use requestAnimationFrame to ensure layout is complete
			requestAnimationFrame(() => {
				if (chatContainer) {
					chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior });
				}
			});
		}
	}

	function handleScroll() {
		if (!chatContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = chatContainer;
		// If we are close to bottom (within 50px), reset the flag
		const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
		userHasScrolledUp = !isAtBottom;
	}

	$effect(() => {
		if (!chatId) {
			messages = [];
			uiState.clearTitle();

			if (initialCompanionId) {
				(async () => {
					const comp = await getCompanionById(initialCompanionId);
					if (comp) {
						currentCompagnon = comp;
						// Clear the global state so it doesn't persist
						uiState.setActiveCompanionId(undefined);
					}
				})();
			}
			return;
		}

		let sub: any;
		void runStore.loadForChat(chatId);

		(async () => {
			// Load chat details to get title
			const chat = await chatService.getChat(chatId);
			if (chat) {
				uiState.setTitle(chat.title);
				if (chat.companion_id) {
					const comp = await getCompanionById(chat.companion_id);
					if (comp) {
						currentCompagnon = { ...comp, model: chat.model || comp.model };
					}
				}
			}

			const obs = await chatService.getMessages(chatId);
			sub = obs.subscribe((data: any[]) => {
				messages = data;
				// Auto-scroll on new messages if user hasn't scrolled up
				if (!userHasScrolledUp) {
					// Use setTimeout to ensure DOM is updated
					setTimeout(() => scrollToBottom(), 0);
				}
			});
		})();

		return () => {
			if (sub) sub.unsubscribe();
			uiState.clearTitle();
			audioService.stopAudio();
		};
	});

	async function sendMessage() {
		if (!messageInput.trim() && selectedFiles.length === 0) return;

		const content = messageInput;
		const filesToSend = [...selectedFiles];

		messageInput = '';
		selectedFiles = [];

		// Force scroll to bottom when sending
		userHasScrolledUp = false;
		setTimeout(() => scrollToBottom(), 0);

		let targetChatId = chatId;

		try {
			if (!targetChatId) {
				// Create chat first
				// Use initialCompanionId if set and user hasn't selected a different one (assuming default is '1')
				const currentCompanionId = getCompanionId(currentCompagnon);
				const companionIdToUse =
					currentCompanionId === '1' && initialCompanionId ? initialCompanionId : currentCompanionId;

				try {
					targetChatId = await chatService.createChat(undefined, currentCompagnon.model, companionIdToUse);
					// Update URL without reloading
					goto(`/chat/${targetChatId}`, { replaceState: true });
					// Update local state so we don't create it again if user spams
					chatId = targetChatId;
				} catch (e) {
					console.error('Error creating chat:', e);
					toast.error(t('chat.create_error') || 'Error creating chat');
					return;
				}
			}

			try {
				await chatService.addMessage(targetChatId, 'user', content, 'sent', filesToSend);
			} catch (e) {
				console.error('Error adding user message:', e);
				toast.error(t('chat.send_error') || 'Error saving message');
				return;
			}

			// Get fresh history from DB including the message we just added
			let history;
			try {
				const messagesDocs = await chatService.getChatHistory(targetChatId);
				history = messagesDocs
					.filter((message: any) => message.role === 'user' || message.role === 'assistant')
					.map((message: any) => ({
						role: message.role,
						content: message.content,
						images: message.images
					}));
			} catch (e) {
				console.error('Error fetching chat history:', e);
				// Continue anyway, maybe we can generate without full history or it will fail next
			}

			if (history) {
				try {
					const responseText = await chatService.generateResponse(targetChatId, history);

					if (userState.preferences.auto_play_audio && responseText) {
						try {
							await audioService.speak(responseText, currentCompagnon.voice_id);
						} catch (e) {
							console.error('TTS Error', e);
						}
					}
				} catch (e) {
					console.error('Error generating response:', e);
					// Error is already handled in chatService.generateResponse (toast + message update)
				}
			}
		} catch (e) {
			console.error('Unexpected error in sendMessage:', e);
			const errMsg = e instanceof Error ? e.message : 'Unknown error';
			toast.error(`${t('chat.send_error') || 'Error sending message'}: ${errMsg}`);
		}
	}

	let isTranscribing = $state(false);

	async function toggleRecording() {
		if (isRecording) {
			try {
				const audioBlob = await audioService.stopRecording();
				isRecording = false;
				isTranscribing = true;

				// Transcribe audio
				let text = '';
				try {
					text = await audioService.transcribe(audioBlob);
				} catch (err) {
					console.error('Transcription failed', err);
					toast.error(t('status.error') || 'Transcription failed');
				} finally {
					isTranscribing = false;
				}

				if (text) {
					messageInput = (messageInput + ' ' + text).trim();
					await sendMessage();
				}
			} catch (error) {
				console.error('Error stopping recording:', error);
				isRecording = false;
				isTranscribing = false;
			}
		} else {
			try {
				await audioService.startRecording();
				isRecording = true;
			} catch (error) {
				console.error('Error starting recording:', error);
				toast.error('Could not access microphone');
			}
		}
	}

	async function onCompagnonSelected(compagnon: ActiveCompanion) {
		currentCompagnon = compagnon;

		if (chatId) {
			await chatService.updateChatRuntime(chatId, {
				model: compagnon.model,
				companionId: getCompanionId(compagnon),
				systemPrompt: compagnon.system_prompt
			});
		}

		toast.info(`${t('ui.interlocutor_changed')} ${compagnon.name}`);
	}

	async function onModelSelected(model: string) {
		if (!model || model === currentCompagnon.model) return;

		currentCompagnon = { ...currentCompagnon, model };
		if (chatId) {
			await chatService.updateChatRuntime(chatId, { model });
		}
	}

	async function regenerateResponse() {
		if (!chatId || messages.length === 0) return;

		// We assume we are regenerating the last response (which should be from assistant)
		// Or if the last message is from user, we just generate.
		const lastMsg = messages[messages.length - 1];

		let history;
		let messageIdToUpdate: string | undefined;

		if (lastMsg.role === 'assistant') {
			// Exclude the last assistant message to regenerate it
			history = messages
				.slice(0, -1)
				.filter((message: any) => message.role === 'user' || message.role === 'assistant')
				.map((message: any) => ({
					role: message.role,
					content: message.content,
					images: message.images
				}));
			messageIdToUpdate = lastMsg.message_id;
		} else {
			// Last message is user, just generate
			history = messages
				.filter((message: any) => message.role === 'user' || message.role === 'assistant')
				.map((message: any) => ({
					role: message.role,
					content: message.content,
					images: message.images
				}));
		}

		try {
			const responseText = await chatService.generateResponse(chatId, history, messageIdToUpdate);
			if (userState.preferences.auto_play_audio && responseText) {
				await audioService.speak(responseText, currentCompagnon.voice_id);
			}
		} catch (e) {
			console.error('Error regenerating response:', e);
		}
	}
</script>

<CompanionSelector bind:isOpen={isCompagnonModalOpen} onSelect={onCompagnonSelected} />

<chat-window>
	{#if uiState.isAudioPlaying}
		<button class="btn-icon stop-audio" onclick={() => audioService.stopAudio()} aria-label="Stop Audio" title="Stop Audio">
			<Icon icon="fluent:stop-24-filled" class="h-6 w-6 fill-current" />
		</button>
	{/if}

	{#if messages.length === 0}
		<chat-empty-state>
			<empty-state-content>
				<img src="/assets/lama.png" alt="Wollama" />
				<h1>{t('ui.ready_to_chat')}</h1>
				<p>{t('ui.select_chat_help')}</p>

				<div class="empty-composer">
					<ChatInput
						bind:value={messageInput}
						bind:files={selectedFiles}
						{isRecording}
						{isTranscribing}
						{currentCompagnon}
						models={availableModels}
						{chatId}
						onsend={sendMessage}
						onrecord={toggleRecording}
						oncompanionclick={() => (isCompagnonModalOpen = true)}
						onmodelchange={onModelSelected}
					/>
				</div>
			</empty-state-content>
		</chat-empty-state>
	{:else}
		<chat-message-list
			role="log"
			aria-label="Chat messages"
			aria-live="polite"
			aria-relevant="additions text"
			bind:this={chatContainer}
			onscroll={handleScroll}
			data-testid="chat-container"
		>
			{#each visibleMessages as message, i}
				{#if message.type === 'ToolCallMessage'}
					<chat-message data-testid="chat-message" data-role={message.role}>
						<message-avatar><img src="/assets/tool.png" alt="" /></message-avatar>
						<message-content><ToolCallMessage {message} /></message-content>
					</chat-message>
				{:else}
					<chat-message data-testid="chat-message" data-role={message.role}>
						{#if message.role !== 'user'}
							<message-avatar>
								{#if currentCompagnon.avatar}
									<img src={currentCompagnon.avatar} alt={currentCompagnon.name} />
								{:else}
									<span>{currentCompagnon.name.substring(0, 2).toUpperCase()}</span>
								{/if}
							</message-avatar>
						{/if}
						<message-stack>
							{#if message.role !== 'user'}
								<small class="message-author">{currentCompagnon.name}</small>
							{/if}
							<message-content>
								<span class="sr-only"
									>{message.role === 'user' ? 'You said:' : `${currentCompagnon.name} said:`}</span
								>
								{#if message.images && message.images.length > 0}
									<message-attachments>
										{#each message.images as img}
											{#if img.startsWith('data:image')}
												<img src={img} alt="attachment" />
											{:else}
												<div class="file-attachment">
													<Icon icon="lucide:file" class="h-6 w-6" /><span>File attached</span>
												</div>
											{/if}
										{/each}
									</message-attachments>
								{/if}
								{#if message.role === 'assistant' && message.status === 'streaming' && !message.content}
									<div class="message-loading" data-testid="loading-indicator">
										<span class="loading-ellipsis">Thinking</span>
									</div>
								{:else if message.role === 'assistant'}
									<ThinkingMessage content={message.content || ''} />
								{:else}
									<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
										{@html parseMarkdown(message.content)}
									</div>
								{/if}
								{#if message.role === 'assistant' && message.status !== 'streaming'}
									<MessageActions
										{message}
										onRegenerate={i === visibleMessages.length - 1 ? regenerateResponse : undefined}
									/>
								{/if}
							</message-content>
						</message-stack>
					</chat-message>
				{/if}
			{/each}
		</chat-message-list>

		{#if activeRunsForChat.length > 0}
			<chat-active-runs>
				{#each activeRunsForChat as run (run.run_id)}
					<RunTimeline runId={run.run_id} />
				{/each}
			</chat-active-runs>
		{/if}

		<chat-composer-dock>
			<ChatInput
				bind:value={messageInput}
				bind:files={selectedFiles}
				{isRecording}
				{isTranscribing}
				{currentCompagnon}
				models={availableModels}
				{chatId}
				onsend={sendMessage}
				onrecord={toggleRecording}
				oncompanionclick={() => (isCompagnonModalOpen = true)}
				onmodelchange={onModelSelected}
			/>
		</chat-composer-dock>
	{/if}
</chat-window>

<style>
	@layer components {
		chat-window,
		chat-empty-state,
		empty-state-content,
		chat-message-list,
		chat-message,
		message-avatar,
		message-stack,
		message-content,
		message-attachments,
		chat-composer-dock {
			display: flex;
		}

		chat-window {
			position: absolute;
			inset: 0;
			min-height: 0;
			flex-direction: column;
			overflow: hidden;
			background: var(--wollama-shell-bg);
		}

		.stop-audio {
			position: fixed;
			top: var(--pad-lg);
			right: var(--pad-md);
			z-index: var(--z-overlay);
			background: var(--color-critical);
			color: var(--color-on-primary);
			box-shadow: var(--shadow-md);
		}

		chat-empty-state {
			min-height: 0;
			flex: 1;
			align-items: center;
			justify-content: center;
			padding: var(--pad-lg);
			overflow-y: auto;
		}

		empty-state-content {
			width: min(100%, 34rem);
			align-items: center;
			flex-direction: column;
			text-align: center;
		}

		empty-state-content > img {
			width: 5rem;
			height: 5rem;
			margin-block-end: var(--pad-md);
			object-fit: contain;
		}

		empty-state-content h1 {
			margin: 0 0 var(--gap-sm);
			font-size: var(--text-xl);
			font-weight: var(--font-semibold);
			letter-spacing: var(--tracking-tight);
			line-height: var(--leading-tight);
		}

		empty-state-content p {
			max-width: 28rem;
			margin: 0 0 var(--pad-lg);
			color: var(--color-text-muted);
			font-size: var(--text-sm);
		}

		.empty-composer {
			width: 100%;
		}

		chat-message-list {
			min-height: 0;
			flex: 1;
			flex-direction: column;
			gap: var(--gap-lg);
			padding: var(--pad-2xl) var(--pad-lg) var(--pad-xl);
			overflow-y: auto;
			scrollbar-gutter: stable;
		}

		chat-active-runs {
			display: flex;
			flex-direction: column;
			gap: var(--gap-sm, var(--pad-sm));
			padding: 0 var(--pad-lg) var(--pad-sm);
		}

		chat-message {
			width: 100%;
			max-width: var(--app-reading-width);
			margin-inline: auto;
			align-items: flex-start;
			gap: var(--gap-md);
		}

		chat-message[data-role='user'] {
			justify-content: flex-end;
		}

		message-avatar {
			width: var(--icon-size-md);
			height: var(--icon-size-md);
			align-items: center;
			justify-content: center;
			flex: 0 0 auto;
			border: var(--border-width) solid var(--wollama-border-subtle);
			border-radius: var(--radius-lg);
			background: var(--color-surface-raised);
			color: var(--color-primary);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
			overflow: hidden;
		}

		message-avatar img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		message-stack {
			min-width: 0;
			max-width: calc(100% - var(--icon-size-md) - var(--gap-md));
			flex: 1;
			align-items: flex-start;
			flex-direction: column;
			gap: var(--gap-xs);
		}

		chat-message[data-role='user'] message-stack {
			max-width: min(78%, 38rem);
			flex: 0 1 auto;
			align-items: flex-end;
		}

		.message-author {
			color: var(--color-text-muted);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
		}

		message-content {
			min-width: 0;
			width: 100%;
			max-width: 100%;
			flex-direction: column;
			padding-block: var(--pad-xs);
			line-height: var(--leading-relaxed);
			overflow-wrap: anywhere;
		}

		chat-message[data-role='user'] message-content {
			width: auto;
			padding: var(--pad-sm) var(--pad-md);
			border: var(--border-width) solid color-mix(in oklch, var(--color-primary) 24%, var(--wollama-border-subtle));
			border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl);
			background: var(--wollama-active-bg);
		}

		message-content :global(.prose) {
			max-width: none;
			color: var(--color-text);
		}

		message-content :global(.prose > :first-child) {
			margin-block-start: 0;
		}

		message-content :global(.prose > :last-child) {
			margin-block-end: 0;
		}

		message-attachments {
			flex-direction: column;
			gap: var(--gap-sm);
			margin-block-end: var(--gap-sm);
		}

		message-attachments > img {
			width: auto;
			max-width: 100%;
			max-height: 16rem;
			border-radius: var(--radius-md);
		}

		.file-attachment,
		.message-loading {
			display: flex;
			align-items: center;
			gap: var(--gap-sm);
			padding: var(--pad-sm);
			background: color-mix(in srgb, var(--color-surface) 25%, transparent);
			border-radius: var(--radius-md);
		}

		chat-composer-dock {
			z-index: var(--z-dropdown);
			width: 100%;
			padding: var(--pad-sm) var(--pad-lg) var(--pad-md);
			background: linear-gradient(to bottom, transparent, var(--wollama-shell-bg) var(--pad-xl));
		}

		chat-composer-dock :global(chat-composer-component) {
			width: 100%;
		}

		@media (max-width: 48rem) {
			chat-message-list,
			chat-composer-dock {
				padding: var(--pad-md) var(--pad-sm);
			}

			chat-message {
				width: 100%;
			}

			message-stack,
			chat-message[data-role='user'] message-stack {
				max-width: 92%;
			}

			message-avatar {
				display: none;
			}
		}
	}
</style>
