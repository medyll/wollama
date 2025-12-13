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

<div class="mx-auto flex h-full w-full max-w-3xl flex-col p-4">
	<h1 class="mb-6 flex items-center gap-2 text-2xl font-bold">
		<Icon icon="lucide:search" />
		Search
	</h1>

	<!-- Search Input -->
	<div class="join mb-4 w-full">
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
	<div class="bg-base-200 rounded-box mb-6 flex flex-wrap gap-4 p-4">
		<span class="text-sm font-semibold opacity-70">Search in:</span>
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
	<div class="flex-1 space-y-4 overflow-y-auto">
		{#if results.length === 0 && hasSearched && !isSearching}
			<div class="py-10 text-center opacity-50">
				No results found for "{query}"
			</div>
		{:else if results.length > 0}
			{#each results as result}
				<button
					class="card bg-base-100 border-base-200 w-full border p-4 text-left shadow-sm transition-shadow hover:shadow-md"
					onclick={() => navigateToResult(result)}
					transition:fade
				>
					<div class="mb-1 flex items-start justify-between">
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
						<h3 class="text-lg font-bold">{result.data.title}</h3>
					{:else if result.type === 'message'}
						<div class="mb-1 text-sm font-semibold">In: {result.chat.title}</div>
						<p class="text-base-content/80 line-clamp-2">{result.data.content}</p>
					{:else if result.type === 'chat_assistant'}
						<h3 class="text-lg font-bold">{result.data.title}</h3>
						<div class="mt-1 flex items-center gap-1 text-sm opacity-70">
							<Icon icon="lucide:bot" class="h-4 w-4" />
							With {result.assistant?.name || 'Unknown Assistant'}
						</div>
					{/if}
				</button>
			{/each}
		{/if}
	</div>
</div>
