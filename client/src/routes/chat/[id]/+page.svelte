<script lang="ts">
    import { page } from '$app/stores';
    import CompagnonSelector from '$components/ui/CompagnonSelector.svelte';
    import type { Companion } from '$types/data';
    
    // Placeholder for chat logic
    let messageInput = $state('');
    let isCompagnonModalOpen = $state(false);
    let currentCompagnon: Companion = $state({ 
        companion_id: '1',
        name: 'Assistant Général', 
        model: 'mistral',
        system_prompt: 'You are a helpful assistant.',
        created_at: Date.now()
    });
    
    // Mock messages for the static view
    let messages = $state([
        { id: 1, role: 'assistant', content: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?' },
        { id: 2, role: 'user', content: 'Je teste l\'interface de chat.' },
        { id: 3, role: 'assistant', content: 'C\'est noté. L\'interface semble fonctionner correctement.' }
    ]);

    function sendMessage() {
        if (!messageInput.trim()) return;
        
        messages.push({
            id: messages.length + 1,
            role: 'user',
            content: messageInput
        });
        messageInput = '';
        
        // Simulate response
        setTimeout(() => {
            messages.push({
                id: messages.length + 1,
                role: 'assistant',
                content: 'Ceci est une réponse simulée.'
            });
        }, 1000);
    }

    function onCompagnonSelected(compagnon: Companion) {
        currentCompagnon = compagnon;
        // Logic to update chat context with new compagnon
        messages.push({
            id: messages.length + 1,
            role: 'system',
            content: `Interlocuteur changé pour : ${compagnon.name}`
        });
    }
</script>

<CompagnonSelector bind:isOpen={isCompagnonModalOpen} onSelect={onCompagnonSelected} />

<div class="flex flex-col h-full">
    <!-- Chat Header -->
    <div class="p-4 border-b border-base-content/10 flex justify-between items-center bg-base-100/50 backdrop-blur">
        <div class="cursor-pointer hover:opacity-70 transition-opacity" onclick={() => isCompagnonModalOpen = true} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && (isCompagnonModalOpen = true)}>
            <h2 class="font-bold text-lg">Discussion #{$page.params.id}</h2>
            <div class="flex items-center gap-2">
                <span class="text-xs opacity-50">Avec: {currentCompagnon.name} ({currentCompagnon.model})</span>
                <span class="badge badge-xs badge-info">Changer</span>
            </div>
        </div>
        <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm btn-circle" aria-label="Chat options">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>
        </div>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[3fr_1fr] lg:gap-4">
        {#each messages as message}
            <div class="chat {message.role === 'user' ? 'chat-end lg:col-start-2' : 'chat-start lg:col-start-1'}">
                <div class="chat-image avatar placeholder">
                    <div class="bg-neutral text-neutral-content rounded-full w-10">
                        <span>{message.role === 'user' ? 'U' : 'AI'}</span>
                    </div>
                </div>
                <div class="chat-header opacity-50 text-xs mb-1">
                    {message.role === 'user' ? 'Vous' : 'Assistant'}
                </div>
                <div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
                    {message.content}
                </div>
            </div>
        {/each}
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-base-content/10 bg-base-100">
        <div class="flex gap-2">
            <button class="btn btn-circle btn-ghost" aria-label="Add attachment">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </button>
            <input 
                type="text" 
                placeholder="Écrivez votre message..." 
                class="input input-bordered flex-1" 
                bind:value={messageInput}
                onkeydown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button class="btn btn-primary btn-circle" onclick={sendMessage} aria-label="Send message">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </div>
    </div>
</div>
