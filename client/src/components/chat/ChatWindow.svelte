<script lang="ts">
    import { t } from '$lib/state/i18n.svelte';
    import { userState } from '$lib/state/user.svelte';
    import { toast } from '$lib/state/notifications.svelte';
    import { audioService } from '$lib/services/audio.service';
    import { chatService } from '$lib/services/chat.service';
    import { parseMarkdown } from '$lib/utils/markdown';
    import CompagnonSelector from '$components/ui/CompagnonSelector.svelte';
    import DataButton from '$components/ui/DataButton.svelte';
    import MessageActions from '$components/chat/MessageActions.svelte';
    import Icon from '@iconify/svelte';
    import type { Companion } from '$types/data';
    import { goto } from '$app/navigation';

    let { chatId = $bindable(undefined), initialCompanionId = undefined } = $props();

    // Placeholder for chat logic
    let messageInput = $state('');
    let isCompagnonModalOpen = $state(false);
    let isRecording = $state(false);
    let selectedFiles = $state<string[]>([]);
    let fileInput: HTMLInputElement;
    let textareaRef: HTMLTextAreaElement;

    let currentCompagnon: Companion = $state({ 
        companion_id: '1',
        name: t('ui.general_assistant'), 
        model: userState.preferences.defaultModel,
        system_prompt: 'You are a helpful assistant.',
        created_at: Date.now()
    });
    
    let messages = $state<any[]>([]);

    $effect(() => {
        if (!chatId) {
            messages = [];
            return;
        }

        let sub: any;
        
        (async () => {
            const obs = await chatService.getMessages(chatId);
            sub = obs.subscribe((data: any[]) => {
                messages = data;
            });
        })();

        return () => {
            if (sub) sub.unsubscribe();
        };
    });

    function triggerFileInput() {
        fileInput.click();
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files) {
            Array.from(input.files).forEach(file => {
                if (file.size > 2 * 1024 * 1024) {
                    toast.error(t('ui.file_too_large', { name: file.name }));
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        // Only add if not already present (simple check)
                        const res = e.target.result as string;
                        if (!selectedFiles.includes(res)) {
                            selectedFiles = [...selectedFiles, res];
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        // Reset input
        input.value = '';
    }

    function removeFile(index: number) {
        selectedFiles = selectedFiles.filter((_, i) => i !== index);
    }

    async function sendMessage() {
        if (!messageInput.trim() && selectedFiles.length === 0) return;
        
        const content = messageInput;
        const filesToSend = [...selectedFiles];
        
        messageInput = '';
        selectedFiles = [];
        
        // Reset height
        if (textareaRef) {
             textareaRef.style.height = 'auto';
        }

        try {
            let targetChatId = chatId;

            if (!targetChatId) {
                // Create chat first
                // Use initialCompanionId if set and user hasn't selected a different one (assuming default is '1')
                const companionIdToUse = (currentCompagnon.companion_id === '1' && initialCompanionId) 
                    ? initialCompanionId 
                    : currentCompagnon.companion_id;
                
                targetChatId = await chatService.createChat(undefined, undefined, companionIdToUse);
                // Update URL without reloading
                goto(`/chat/${targetChatId}`, { replaceState: true });
                // Update local state so we don't create it again if user spams
                chatId = targetChatId;
            }

            await chatService.addMessage(targetChatId, 'user', content, 'sent', filesToSend);
            
            // Get fresh history from DB including the message we just added
            const messagesDocs = await chatService.getChatHistory(targetChatId);
            const history = messagesDocs.map((m: any) => ({ 
                role: m.role, 
                content: m.content,
                images: m.images 
            }));
            
            const responseText = await chatService.generateResponse(targetChatId, history);

            if (userState.preferences.auto_play_audio && responseText) {
                try {
                    await audioService.speak(responseText, currentCompagnon.voice_id);
                } catch (e) {
                    console.error('TTS Error', e);
                }
            }
        } catch (e) {
            console.error('Error sending message:', e);
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
                try {
                    const text = await audioService.transcribe(audioBlob);
                    if (text) {
                        messageInput = (messageInput + ' ' + text).trim();
                        // We do NOT send automatically anymore, allowing user to review/edit
                        // sendMessage(); 
                    }
                } catch (err) {
                    console.error('Transcription failed', err);
                    toast.error(t('status.error') || 'Transcription failed');
                } finally {
                    isTranscribing = false;
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
        if (lastMsg.role === 'assistant') {
            // Exclude the last assistant message to regenerate it
            history = messages.slice(0, -1).map((m: any) => ({ 
                role: m.role, 
                content: m.content,
                images: m.images 
            }));
        } else {
            // Last message is user, just generate
            history = messages.map((m: any) => ({ 
                role: m.role, 
                content: m.content,
                images: m.images 
            }));
        }

        try {
            const responseText = await chatService.generateResponse(chatId, history);
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

    function autoResize(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = target.scrollHeight + 'px';
    }
</script>

<CompagnonSelector bind:isOpen={isCompagnonModalOpen} onSelect={onCompagnonSelected} />

<div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="p-4 border-b border-base-content/10 flex justify-between items-center bg-base-100/50 backdrop-blur">
        <div class="flex items-center gap-4">
            <div class="cursor-pointer hover:opacity-70 transition-opacity" onclick={() => isCompagnonModalOpen = true} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (isCompagnonModalOpen = true)}>
                <h2 class="font-bold text-lg">
                    {#if chatId}
                        {t('ui.chat_title')} #{chatId}
                    {:else}
                        {t('ui.newChat')}
                    {/if}
                </h2>
                <div class="flex items-center gap-2">
                    <span class="text-xs opacity-50">{t('ui.with')} {currentCompagnon.name} ({currentCompagnon.model})</span>
                    <span class="badge badge-xs badge-info">{t('ui.change')}</span>
                </div>
            </div>
            {#if chatId}
                <DataButton 
                    table="chats" 
                    table_id={chatId} 
                    mode="delete" 
                    confirm={true} 
                />
            {/if}
        </div>
        <div class="flex gap-2 items-center">
            <label class="swap swap-rotate btn btn-ghost btn-sm btn-circle" aria-label="Toggle Audio Response">
                <!-- this hidden checkbox controls the state -->
                <input 
                    type="checkbox" 
                    bind:checked={userState.preferences.auto_play_audio} 
                    onchange={() => userState.save()}
                />
                
                <!-- volume on icon -->
                <svg class="swap-on fill-current w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z" /></svg>
                
                <!-- volume off icon -->
                <svg class="swap-off fill-current w-5 h-5 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z" /></svg>
            </label>
            <button class="btn btn-ghost btn-sm btn-circle" aria-label="Chat options">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
        </div>
    </div>

    <!-- Messages Area -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" onclick={handleMessageClick}>
        {#if messages.length === 0}
            <div class="hero h-full">
                <div class="hero-content text-center">
                    <div class="max-w-md flex flex-col items-center">
                        <img src="/assets/lama.png" alt="Wollama" class="w-32 h-32 object-contain mb-6 opacity-90" />
                        <h1 class="text-3xl font-bold">{t('ui.ready_to_chat')}</h1>
                        <p class="py-6">{t('ui.select_chat_help')}</p>
                        <button class="btn btn-primary" onclick={() => document.querySelector('textarea')?.focus()}>{t('ui.type_message')}</button>
                    </div>
                </div>
            </div>
        {:else}
            {#each messages as message, i}
                <div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
                    <div class="chat-image avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-10">
                            <span>{message.role === 'user' ? 'U' : 'AI'}</span>
                        </div>
                    </div>
                    <div class="chat-header opacity-50 text-xs mb-1">
                        {message.role === 'user' ? t('ui.you') : t('ui.assistant')}
                    </div>
                    <div class="chat-bubble rounded-2xl rounded-tl-none rounded-tr-none before:hidden {message.role === 'user' ? 'chat-bubble-primary' : 'bg-transparent text-base-content p-0'}">
                        {message.status}
                        {#if message.images && message.images.length > 0}
                            <div class="flex flex-wrap gap-2 mb-2">
                                {#each message.images as img}
                                    {#if img.startsWith('data:image')}
                                        <img src={img} alt="attachment" class="max-w-full h-auto rounded-lg max-h-64" />
                                    {:else}
                                        <div class="flex items-center gap-2 p-2 bg-base-100/20 rounded-lg">
                                            <Icon icon="lucide:file" class="w-6 h-6" />
                                            <span class="text-xs opacity-70">File attached</span>
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                        {/if}
                        {#if message.role === 'assistant' && message.status === 'streaming' && !message.content}
                            <div class="flex w-52 flex-col gap-4 p-2">
                                <div class="skeleton h-4 w-28 opacity-50"></div>
                                <div class="skeleton h-4 w-full opacity-50"></div>
                                <div class="skeleton h-4 w-full opacity-50"></div>
                            </div>
                        {:else}
                            <div class="prose prose-sm max-w-none dark:prose-invert wrap-break-word">
                                {@html parseMarkdown(message.content)}
                            </div>
                            {#if message.role === 'assistant' && message.status !== 'streaming'}
                                <MessageActions 
                                    message={message} 
                                    onRegenerate={i === messages.length - 1 ? regenerateResponse : undefined} 
                                />
                            {/if}
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Input Area -->
    <div class="p-4  bg-base-100">
        <!-- File Previews -->
        {#if selectedFiles.length > 0}
            <div class="flex gap-2 p-2 overflow-x-auto mb-2">
                {#each selectedFiles as file, i}
                    <div class="relative group shrink-0">
                        {#if file.startsWith('data:image')}
                            <img src={file} alt="preview" class="h-20 w-20 object-cover rounded-lg border border-base-content/10" />
                        {:else}
                            <div class="h-20 w-20 flex flex-col items-center justify-center bg-base-200 rounded-lg border border-base-content/10">
                                <Icon icon="lucide:file" class="w-8 h-8 opacity-50" />
                                <span class="text-[10px] opacity-50">File</span>
                            </div>
                        {/if}
                        <button class="btn btn-circle btn-xs btn-error absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-md" onclick={() => removeFile(i)}>✕</button>
                    </div>
                {/each}
            </div>
        {/if}

        <div class="bg-base-200 rounded-2xl p-2 border border-base-content/10 focus-within:border-primary transition-colors">
            <textarea 
                bind:this={textareaRef}
                placeholder={t('ui.type_message')} 
                class="textarea textarea-ghost w-full resize-none focus:outline-none bg-transparent px-2 py-2 min-h-12 text-base max-h-[50vh] overflow-y-auto" 
                rows="1"
                bind:value={messageInput}
                oninput={autoResize}
                onkeydown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
            ></textarea>
            
            <div class="flex justify-between items-center mt-1 px-1">
                <!-- Left: Attachments -->
                <div>
                    <input 
                        type="file" 
                        class="hidden" 
                        multiple 
                        bind:this={fileInput} 
                        onchange={handleFileSelect} 
                    />
                    <button class="btn btn-ghost btn-sm btn-circle" aria-label="Add attachment" onclick={triggerFileInput}>
                        <Icon icon="lucide:paperclip" class="w-5 h-5 opacity-70" />
                    </button>
                </div>

                <!-- Right: Send / Mic -->
                <div>
                    {#if !messageInput.trim()}
                        <button 
                            class="btn btn-circle btn-sm {isRecording ? 'btn-error animate-pulse' : 'btn-ghost'}" 
                            onclick={toggleRecording}
                            aria-label={isRecording ? "Stop recording" : "Start recording"}
                            disabled={isTranscribing}
                        >
                            {#if isTranscribing}
                                <span class="loading loading-spinner loading-xs"></span>
                            {:else if isRecording}
                                <Icon icon="lucide:square" class="w-5 h-5" />
                            {:else}
                                <Icon icon="lucide:mic" class="w-5 h-5 opacity-70" />
                            {/if}
                        </button>
                    {:else}
                        <button class="btn btn-primary btn-sm btn-circle" onclick={sendMessage} aria-label="Send message">
                            <Icon icon="lucide:send-horizontal" class="w-5 h-5" />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
