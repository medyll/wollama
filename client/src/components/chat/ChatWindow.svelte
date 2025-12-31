<script lang="ts">
	import { t } from '$lib/state/i18n.svelte';
	import { userState } from '$lib/state/user.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { toast } from '$lib/state/notifications.svelte';
	import { audioService } from '$lib/services/audio.service';
	import { chatService } from '$lib/services/chat.service';
	import { companionService } from '$lib/services/companion.service';
	import { parseMarkdown } from '$lib/utils/markdown';
	import CompanionSelector from '$components/ui/CompanionSelector.svelte';
	import MessageActions from '$components/chat/MessageActions.svelte';
	import ThinkingMessage from '$components/chat/ThinkingMessage.svelte';
	import ChatInput from '$components/chat/ChatInput.svelte';
	import Icon from '@iconify/svelte';
	import type { Companion } from '$types/data';
	import { goto } from '$app/navigation';

	let { chatId = $bindable(undefined), initialCompanionId = undefined } = $props();

	// Placeholder for chat logic
	let messageInput = $state('');
	let isCompagnonModalOpen = $state(false);
	let isRecording = $state(false);
	let selectedFiles = $state<string[]>([]);

	let currentCompagnon: Companion = $state({
		companion_id: '1',
		name: t('ui.general_assistant'),
		model: userState.preferences.defaultModel,
		system_prompt: 'You are a helpful assistant.',
		created_at: Date.now()
	});

	let messages = $state<any[]>([]);
	let chatContainer = $state<HTMLDivElement>();
	let userHasScrolledUp = $state(false);

	function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
		if (chatContainer) {
			chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior });
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
					const comp = await companionService.get(initialCompanionId);
					if (comp) {
						currentCompagnon = comp as Companion;
						// Clear the global state so it doesn't persist
						uiState.setActiveCompanionId(undefined);
					}
				})();
			}
			return;
		}

		let sub: any;

		(async () => {
			// Load chat details to get title
			const chat = await chatService.getChat(chatId);
			if (chat) {
				uiState.setTitle(chat.title);
				if (chat.companion_id) {
					const comp = await companionService.get(chat.companion_id);
					if (comp) {
						currentCompagnon = comp as Companion;
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
				const companionIdToUse =
					currentCompagnon.companion_id === '1' && initialCompanionId
						? initialCompanionId
						: currentCompagnon.companion_id;

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
				history = messagesDocs.map((m: any) => ({
					role: m.role,
					content: m.content,
					images: m.images
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

	function onCompagnonSelected(compagnon: Companion) {
		currentCompagnon = compagnon;
		// Logic to update chat context with new compagnon
		if (messages.length > 0) {
			messages.push({
				id: messages.length + 1,
				role: 'system',
				content: `${t('ui.interlocutor_changed')} ${compagnon.name}`
			});
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
			history = messages.slice(0, -1).map((m: any) => ({
				role: m.role,
				content: m.content,
				images: m.images
			}));
			messageIdToUpdate = lastMsg.message_id;
		} else {
			// Last message is user, just generate
			history = messages.map((m: any) => ({
				role: m.role,
				content: m.content,
				images: m.images
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

	function handleMessageClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const btn = target.closest('.copy-btn');
		if (btn) {
			const code = decodeURIComponent(btn.getAttribute('data-code') || '');
			if (code) {
				navigator.clipboard.writeText(code).then(() => {
					toast.success(t('ui.copied_to_clipboard') || 'Copied to clipboard');
				});
			}
		}
	}
</script>

<CompanionSelector bind:isOpen={isCompagnonModalOpen} onSelect={onCompagnonSelected} />

<div class="absolute inset-0 flex flex-col overflow-y-auto" bind:this={chatContainer} onscroll={handleScroll}>
	{#if uiState.isAudioPlaying}
		<button
			class="btn btn-circle btn-error fixed top-20 right-4 z-50 shadow-lg"
			onclick={() => audioService.stopAudio()}
			aria-label="Stop Audio"
			title="Stop Audio"
		>
			<Icon icon="fluent:stop-24-filled" class="h-6 w-6 fill-current" />
		</button>
	{/if}

	<!-- Section: Header Removed (Moved to Input Area) -->

	{#if messages.length === 0}
		<!-- Section: Empty State -->
		<div class="flex flex-1 flex-col items-center justify-center p-4">
			<div class="flex w-full max-w-md flex-col items-center">
				<img src="/assets/lama.png" alt="Wollama" class="mb-6 h-32 w-32 object-contain opacity-90" />
				<h1 class="mb-2 text-3xl font-bold">{t('ui.ready_to_chat')}</h1>
				<p class="mb-8 opacity-70">{t('ui.select_chat_help')}</p>

				<div class="w-full">
					<ChatInput
						bind:value={messageInput}
						bind:files={selectedFiles}
						{isRecording}
						{isTranscribing}
						{currentCompagnon}
						{chatId}
						onsend={sendMessage}
						onrecord={toggleRecording}
						oncompanionclick={() => (isCompagnonModalOpen = true)}
					/>
				</div>
			</div>
		</div>
	{:else}
		<!-- Section: Messages Area -->
		<div class="flex-1 space-y-4 p-4" role="log" aria-label="Chat messages">
			{#each messages as message, i}
				<div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
					<div class="chat-image avatar placeholder self-start">
						{#if message.role === 'user'}
							<div class="bg-neutral text-neutral-content w-10 rounded-full">
								<span>U</span>
							</div>
						{:else if currentCompagnon.avatar}
							<div class="w-10 rounded-full">
								<img src={currentCompagnon.avatar} alt={currentCompagnon.name} />
							</div>
						{:else}
							<div class="bg-primary text-primary-content w-10 rounded-full">
								<span>{currentCompagnon.name.substring(0, 2).toUpperCase()}</span>
							</div>
						{/if}
					</div>
					{#if message.role !== 'user'}
						<div class="chat-header mb-1 text-xs opacity-50">
							{currentCompagnon.name}
						</div>
					{/if}
					<div
						class="chat-bubble rounded-2xl rounded-tl-none rounded-tr-none before:hidden {message.role === 'user'
							? 'chat-bubble-primary'
							: 'text-base-content bg-transparent p-0'}"
					>
						{#if message.images && message.images.length > 0}
							<div class="mb-2 space-y-2">
								{#each message.images as img}
									{#if img.startsWith('data:image')}
										<img src={img} alt="attachment" class="h-auto max-h-64 max-w-full rounded-lg" />
									{:else}
										<div class="bg-base-100/20 flex items-center gap-2 rounded-lg p-2">
											<Icon icon="lucide:file" class="h-6 w-6" />
											<span class="text-xs opacity-70">File attached</span>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
						{#if message.role === 'assistant' && message.status === 'streaming' && !message.content}
							<div class="bg-base-200/50 flex w-fit items-center rounded-2xl px-4 py-2">
								<span class="loading loading-dots loading-sm opacity-50"></span>
							</div>
						{:else}
							{#if message.role === 'assistant'}
								<ThinkingMessage content={message.content || ''} />
							{:else}
								<div class="prose prose-sm dark:prose-invert max-w-none wrap-break-word">
									{@html parseMarkdown(message.content)}
								</div>
							{/if}

							{#if message.role === 'assistant' && message.status !== 'streaming'}
								<MessageActions
									{message}
									onRegenerate={i === messages.length - 1 ? regenerateResponse : undefined}
								/>
							{/if}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Section: Input Area (Bottom) -->
		<div class="bg-base-100 sticky bottom-0 z-20 w-full p-0 md:p-4">
			<ChatInput
				bind:value={messageInput}
				bind:files={selectedFiles}
				{isRecording}
				{isTranscribing}
				{currentCompagnon}
				{chatId}
				onsend={sendMessage}
				onrecord={toggleRecording}
				oncompanionclick={() => (isCompagnonModalOpen = true)}
			/>
		</div>
	{/if}
</div>
