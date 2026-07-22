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

<search-page>
	<h1>
		<Icon icon="lucide:search" />
		Search
	</h1>

	<!-- Search Input -->
	<search-bar>
		<input
			type="text"
			class="search-input"
			placeholder="Search chats, messages, assistants..."
			bind:value={query}
			onkeydown={handleKeydown}
		/>
		<button class="btn-primary" onclick={handleSearch} disabled={isSearching}>
			{#if isSearching}
				<span class="loading-ellipsis" aria-label="Searching">Loading</span>
			{:else}
				Search
			{/if}
		</button>
	</search-bar>

	<!-- Filters -->
	<search-filters>
		<strong>Search in:</strong>
		<label class="checkbox-row">
			<span>Chat Names</span>
			<input type="checkbox" bind:checked={filters.chatName} />
		</label>
		<label class="checkbox-row">
			<span>Messages</span>
			<input type="checkbox" bind:checked={filters.messageContent} />
		</label>
		<label class="checkbox-row">
			<span>Assistant Names</span>
			<input type="checkbox" bind:checked={filters.assistantName} />
		</label>
	</search-filters>

	<!-- Results -->
	<search-results aria-live="polite">
		{#if results.length === 0 && hasSearched && !isSearching}
			<search-empty>
				No results found for "{query}"
			</search-empty>
		{:else if results.length > 0}
			{#each results as result}
				<button
					class="search-result"
					onclick={() => navigateToResult(result)}
					transition:fade
				>
					<div class="mb-1 flex items-start justify-between">
						<div class="flex items-center gap-2">
							{#if result.type === 'chat'}
								<span class="result-kind" data-kind="chat">Chat</span>
							{:else if result.type === 'message'}
								<span class="result-kind" data-kind="message">Message</span>
							{:else if result.type === 'chat_assistant'}
								<span class="result-kind" data-kind="assistant">Assistant</span>
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
	</search-results>
</search-page>

<style>
	@layer components {
		search-page,
		search-bar,
		search-filters,
		search-results,
		search-empty {
			display: flex;
		}

		search-page {
			width: min(100%, 52rem);
			height: 100%;
			margin-inline: auto;
			padding: var(--pad-lg);
			flex-direction: column;
		}

		search-page h1 {
			display: flex;
			align-items: center;
			gap: var(--gap-sm);
			margin-block: 0 var(--pad-xl);
		}

		search-bar {
			width: 100%;
			gap: var(--gap-sm);
			margin-block-end: var(--pad-lg);
		}

		.search-input {
			min-width: 0;
			flex: 1;
		}

		search-filters {
			align-items: center;
			flex-wrap: wrap;
			gap: var(--gap-lg);
			margin-block-end: var(--pad-xl);
			padding: var(--pad-lg);
			background: var(--color-surface-raised);
			border-radius: var(--radius-md);
		}

		search-filters strong {
			font-size: var(--text-sm);
			color: var(--color-text-muted);
		}

		.checkbox-row {
			display: inline-flex;
			align-items: center;
			gap: var(--gap-sm);
			cursor: pointer;
		}

		search-results {
			min-height: 0;
			flex: 1;
			flex-direction: column;
			gap: var(--gap-md);
			overflow-y: auto;
		}

		search-empty {
			min-height: 12rem;
			align-items: center;
			justify-content: center;
			color: var(--color-text-muted);
		}

		.search-result {
			width: 100%;
			padding: var(--pad-lg);
			border: var(--border-width) solid var(--color-border);
			background: var(--color-surface);
			color: var(--color-text);
			border-radius: var(--radius-md);
			box-shadow: var(--shadow-sm);
			text-align: start;
			transition: box-shadow var(--transition-fast), transform var(--transition-fast);
		}

		.search-result:hover {
			box-shadow: var(--shadow-md);
			transform: translateY(-1px);
		}

		.result-kind {
			display: inline-flex;
			padding: var(--pad-xs) var(--pad-sm);
			border: var(--border-width) solid currentColor;
			border-radius: var(--radius-full);
			color: var(--color-primary);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
		}

		.result-kind[data-kind='message'] {
			color: var(--color-secondary);
		}

		.result-kind[data-kind='assistant'] {
			color: var(--color-complementary);
		}

		@media (max-width: 36rem) {
			search-page {
				padding: var(--pad-md);
			}

			search-bar {
				flex-direction: column;
			}

			search-bar button {
				width: 100%;
			}
		}
	}
</style>
