<script lang="ts">
	import { onMount } from 'svelte';
	import type { Companion } from '$types/data';
	import { companionService } from '$lib/services/companion.service';
	import { userState } from '$lib/state/user.svelte';

	interface Props {
		onSelect: (companion: Companion) => void;
		onCustomize?: (companion: Companion) => void;
	}

	let { onSelect, onCustomize }: Props = $props();

	let companions: Companion[] = $state([]);
	let isLoading = $state(true);
	let error: string | null = $state(null);
	let selectedId: string | null = $state(null);
	let focusedIndex: number = $state(-1);

	onMount(async () => {
		try {
			isLoading = true;
			error = null;
			const all = await companionService.getAll(userState.uid || '');
			// Filter to only system companions (is_locked: true)
			companions = all.filter((c): c is Companion => 'is_locked' in c && c.is_locked === true);
		} catch (err) {
			error = `Failed to load companions: ${err instanceof Error ? err.message : String(err)}`;
			console.error('Error loading companions:', err);
		} finally {
			isLoading = false;
		}
	});

	function handleSelect(companion: Companion) {
		selectedId = companion.companion_id;
		onSelect(companion);
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		const maxIndex = companions.length - 1;

		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			focusedIndex = Math.min(index + 1, maxIndex);
			const nextCard = document.querySelector(`[data-companion-id="${companions[focusedIndex]?.companion_id}"]`);
			(nextCard as HTMLElement)?.focus();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(index - 1, 0);
			const prevCard = document.querySelector(`[data-companion-id="${companions[focusedIndex]?.companion_id}"]`);
			(prevCard as HTMLElement)?.focus();
		} else if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleSelect(companions[index]);
		}
	}

	function handleCardFocus(index: number) {
		focusedIndex = index;
	}
</script>

<div class="companion-selector" role="region" aria-label="Companion Selection">
	<div class="selector-header">
		<h2 class="text-2xl font-bold">Choose Your Companion</h2>
		<p class="mt-2 text-gray-600">
			Select a pre-configured companion to start chatting. You can customize or create new ones later.
		</p>
	</div>

	{#if isLoading}
		<div class="loading-state flex h-64 items-center justify-center">
			<div class="spinner" aria-label="Loading companions">
				<div class="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
			</div>
		</div>
	{:else if error}
		<div class="error-state alert alert-error" role="alert">
			<p>{error}</p>
		</div>
	{:else if companions.length === 0}
		<div class="empty-state alert alert-info">
			<p>No companions available. Please refresh or contact support.</p>
		</div>
	{:else}
		<div class="companions-scroll-container">
			<div class="companions-grid grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
				{#each companions as companion, index (companion.companion_id)}
					<button
						type="button"
						data-companion-id={companion.companion_id}
						class="companion-card card bg-base-100 cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md"
						class:ring-2={selectedId === companion.companion_id}
						class:ring-primary={selectedId === companion.companion_id}
						aria-pressed={selectedId === companion.companion_id}
						aria-label={`Select ${companion.name} companion`}
						onclick={() => handleSelect(companion)}
						onkeydown={(e) => handleKeyDown(e, index)}
						onfocus={() => handleCardFocus(index)}
					>
						<div class="card-body p-2">
							<!-- Avatar Section -->
							{#if companion.avatar}
								<div class="mx-auto mb-1 h-12 w-12">
									<img
										src={companion.avatar}
										alt={`${companion.name} avatar`}
										class="h-full w-full rounded-lg object-cover"
									/>
								</div>
							{:else}
								<div
									class="from-primary to-secondary mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br text-lg font-bold text-white"
									aria-label={`${companion.name} placeholder`}
								>
									{companion.name.charAt(0).toUpperCase()}
								</div>
							{/if}

							<!-- Name (compact) -->
							<h3 class="line-clamp-1 text-center text-xs font-semibold">
								{companion.name}
							</h3>

							<!-- Badge -->
							<div class="badge badge-primary badge-outline badge-xs mx-auto">Default</div>

							<!-- Description (minimal) -->
							{#if companion.description}
								<p class="line-clamp-1 text-center text-xs text-gray-600">
									{companion.description}
								</p>
							{/if}

							<!-- Metadata (compact) -->
							<div class="metadata-section mt-1 flex flex-wrap items-center justify-center gap-1">
								{#if companion.model}
									<span class="badge badge-xs badge-outline" title={`Model: ${companion.model}`}>
										{companion.model.split(':')[0]}
									</span>
								{/if}
								{#if companion.specialization}
									<span
										class="badge badge-xs badge-ghost"
										title={`Specialization: ${companion.specialization}`}
									>
										{companion.specialization.slice(0, 5)}
									</span>
								{/if}
							</div>

							<!-- Actions (if customize callback) -->
							{#if onCustomize}
								<div class="actions-section mt-1">
									<button
										type="button"
										class="btn btn-secondary btn-xs w-full"
										onclick={(e) => {
											e.stopPropagation();
											onCustomize(companion);
										}}
										aria-label={`Customize ${companion.name}`}
									>
										Customize
									</button>
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.companion-selector {
		padding: 1rem;
		max-width: 1000px;
		margin: 0 auto;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.selector-header {
		text-align: center;
		margin-bottom: 1rem;
	}

	.companions-scroll-container {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		border-radius: 0.5rem;
		padding-right: 0.5rem;
	}

	/* Custom scrollbar styling */
	.companions-scroll-container::-webkit-scrollbar {
		width: 6px;
	}

	.companions-scroll-container::-webkit-scrollbar-track {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 3px;
	}

	.companions-scroll-container::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
	}

	.companions-scroll-container::-webkit-scrollbar-thumb:hover {
		background: rgba(0, 0, 0, 0.5);
	}

	.companion-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		transition:
			box-shadow 200ms ease,
			transform 200ms ease;
		min-height: 100%;
	}

	.companion-card:hover {
		transform: translateY(-1px);
	}

	.companion-card:focus {
		outline: 2px solid var(--primary-color, #570df8);
		outline-offset: 1px;
	}

	.metadata-section {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		justify-content: center;
	}

	.line-clamp-1 {
		display: -webkit-box;
		line-clamp: 1;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 640px) {
		.companion-selector {
			padding: 0.75rem;
		}

		:global(.companions-grid) {
			grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
		}
	}
</style>
