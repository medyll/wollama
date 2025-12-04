<script lang="ts">
    import { chatService } from '$lib/services/chat.service';
    import Icon from '@iconify/svelte';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let query = $state('');
    let filters = $state({
        chatName: true,
        messageContent: true,
        assistantName: true
    });
    let sortOrder = $state<'desc' | 'asc'>('desc');
    let results = $state<any[]>([]);
    let isSearching = $state(false);
    let hasSearched = $state(false);

    async function handleSearch() {
        if (!query.trim()) return;
        isSearching = true;
        hasSearched = true;
        try {
            results = await chatService.search(query, filters, sortOrder);
        } catch (e) {
            console.error(e);
            results = [];
        } finally {
            isSearching = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleString();
    }

    function navigateToResult(result: any) {
        if (result.type === 'message') {
            goto(`/chat/${result.data.chat_id}`);
        } else {
            goto(`/chat/${result.data.chat_id}`);
        }
    }
</script>

<div class="flex flex-col h-full p-4 max-w-3xl mx-auto w-full">
    <h1 class="text-2xl font-bold mb-6 flex items-center gap-2">
        <Icon icon="lucide:search" />
        Search
    </h1>

    <!-- Search Input -->
    <div class="join w-full mb-4">
        <input 
            type="text" 
            class="input input-bordered join-item w-full" 
            placeholder="Search chats, messages, assistants..." 
            bind:value={query}
            onkeydown={handleKeydown}
        />
        <button class="btn btn-primary join-item" onclick={handleSearch} disabled={isSearching}>
            {#if isSearching}
                <span class="loading loading-spinner loading-sm"></span>
            {:else}
                Search
            {/if}
        </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-4 mb-6 p-4 bg-base-200 rounded-box">
        <span class="font-semibold text-sm opacity-70">Search in:</span>
        <label class="label cursor-pointer gap-2 p-0">
            <span class="label-text">Chat Names</span>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" bind:checked={filters.chatName} />
        </label>
        <label class="label cursor-pointer gap-2 p-0">
            <span class="label-text">Messages</span>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" bind:checked={filters.messageContent} />
        </label>
        <label class="label cursor-pointer gap-2 p-0">
            <span class="label-text">Assistant Names</span>
            <input type="checkbox" class="checkbox checkbox-sm checkbox-primary" bind:checked={filters.assistantName} />
        </label>
    </div>

    <!-- Results -->
    <div class="flex-1 overflow-y-auto space-y-4">
        {#if results.length === 0 && hasSearched && !isSearching}
            <div class="text-center opacity-50 py-10">
                No results found for "{query}"
            </div>
        {:else if results.length > 0}
            {#each results as result}
                <button 
                    class="w-full text-left card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200 p-4"
                    onclick={() => navigateToResult(result)}
                    transition:fade
                >
                    <div class="flex justify-between items-start mb-1">
                        <div class="flex items-center gap-2">
                            {#if result.type === 'chat'}
                                <span class="badge badge-primary badge-outline text-xs">Chat</span>
                            {:else if result.type === 'message'}
                                <span class="badge badge-secondary badge-outline text-xs">Message</span>
                            {:else if result.type === 'chat_assistant'}
                                <span class="badge badge-accent badge-outline text-xs">Assistant</span>
                            {/if}
                            <span class="text-xs opacity-50">{formatDate(result.date)}</span>
                        </div>
                    </div>

                    {#if result.type === 'chat'}
                        <h3 class="font-bold text-lg">{result.data.title}</h3>
                    {:else if result.type === 'message'}
                        <div class="text-sm font-semibold mb-1">In: {result.chat.title}</div>
                        <p class="text-base-content/80 line-clamp-2">{result.data.content}</p>
                    {:else if result.type === 'chat_assistant'}
                        <h3 class="font-bold text-lg">{result.data.title}</h3>
                        <div class="text-sm opacity-70 flex items-center gap-1 mt-1">
                            <Icon icon="lucide:bot" class="w-4 h-4" />
                            With {result.assistant?.name || 'Unknown Assistant'}
                        </div>
                    {/if}
                </button>
            {/each}
        {/if}
    </div>
</div>
