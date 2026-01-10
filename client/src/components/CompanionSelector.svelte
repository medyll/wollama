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
		<div class="companions-grid mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each companions as companion, index (companion.companion_id)}
				<button
					type="button"
					data-companion-id={companion.companion_id}
					class="companion-card card bg-base-100 cursor-pointer shadow-md transition-all duration-200 hover:shadow-lg"
					class:ring-2={selectedId === companion.companion_id}
					class:ring-primary={selectedId === companion.companion_id}
					aria-pressed={selectedId === companion.companion_id}
					aria-label={`Select ${companion.name} companion`}
					onclick={() => handleSelect(companion)}
					onkeydown={(e) => handleKeyDown(e, index)}
					onfocus={() => handleCardFocus(index)}
				>
					<div class="card-body">
						<!-- Avatar Section -->
						{#if companion.avatar}
							<div class="mx-auto mb-2 h-16 w-16">
								<img
									src={companion.avatar}
									alt={`${companion.name} avatar`}
									class="h-full w-full rounded-lg object-cover"
								/>
							</div>
						{:else}
							<div
								class="from-primary to-secondary mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-linear-to-br text-2xl font-bold text-white"
								aria-label={`${companion.name} placeholder`}
							>
								{companion.name.charAt(0).toUpperCase()}
							</div>
						{/if}

						<!-- Badge -->
						<div class="badge badge-primary badge-outline mx-auto mb-2">Default</div>

						<!-- Name -->
						<h3 class="card-title text-center text-lg">{companion.name}</h3>

						<!-- Description -->
						{#if companion.description}
							<p class="line-clamp-2 text-center text-sm text-gray-600">
								{companion.description}
							</p>
						{/if}

						<!-- Metadata -->
						<div class="metadata-section mt-3 border-t border-gray-200 pt-3">
							<div class="flex items-center justify-center gap-2 text-xs">
								{#if companion.model}
									<span class="badge badge-sm badge-outline" title={`Model: ${companion.model}`}>
										{companion.model.split(':')[0]}
									</span>
								{/if}
								{#if companion.specialization}
									<span
										class="badge badge-sm badge-ghost"
										title={`Specialization: ${companion.specialization}`}
									>
										{companion.specialization}
									</span>
								{/if}
							</div>
						</div>

						<!-- Voice Info (optional) -->
						{#if companion.voice_tone}
							<div class="voice-info mt-2 text-center text-xs text-gray-500">
								<span title={`Voice tone: ${companion.voice_tone}`}>
									🎙️ {companion.voice_tone}
								</span>
							</div>
						{/if}

						<!-- Actions -->
						{#if onCustomize}
							<div class="actions-section mt-4 flex justify-center gap-2 border-t border-gray-200 pt-3">
								<button
									type="button"
									class="btn btn-secondary btn-sm"
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
	{/if}
</div>

<style>
	.companion-selector {
		padding: 2rem 1rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.selector-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.companion-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 1.5rem;
		transition:
			box-shadow 200ms ease,
			transform 200ms ease;
		min-height: 100%;
	}

	.companion-card:hover {
		transform: translateY(-2px);
	}

	.companion-card:focus {
		outline: 2px solid var(--primary-color, #570df8);
		outline-offset: 2px;
	}

	.metadata-section {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	.line-clamp-2 {
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.companion-card {
			padding: 1rem;
		}

		.companions-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
