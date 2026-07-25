<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { UserCompanion } from '$types/data';
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { userState } from '$lib/state/user.svelte';

	interface Props {
		onSelect: (companion: UserCompanion) => void;
		onCustomize?: (companion: UserCompanion) => void;
	}

	let { onSelect, onCustomize }: Props = $props();

	let companions: UserCompanion[] = $state([]);
	let isLoading = $state(true);
	let error: string | null = $state(null);
	let selectedId: string | null = $state(null);
	let focusedIndex: number = $state(-1);
	let subscription: { unsubscribe: () => void } | null = null;

	onMount(async () => {
		try {
			error = null;
			const userCompanionService = new DataGenericService<UserCompanion>('user_companions');
			const query = await userCompanionService.getQuery({ user_id: userState.uid || '' });
			// Reactive subscription: auto-updates when importDefaultCompanions() writes to DB
			subscription = query.$.subscribe((docs: any[]) => {
				companions = docs.map((doc) => doc.toJSON() as UserCompanion);
				isLoading = false;
			});
		} catch (err) {
			error = `Failed to load companions: ${err instanceof Error ? err.message : String(err)}`;
			console.error('Error loading companions:', err);
			isLoading = false;
		}
	});

	onDestroy(() => {
		subscription?.unsubscribe();
	});

	function handleSelect(companion: UserCompanion) {
		selectedId = companion.user_companion_id;
		onSelect(companion);
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		const maxIndex = companions.length - 1;

		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			focusedIndex = Math.min(index + 1, maxIndex);
			const nextCard = document.querySelector(`[data-companion-id="${companions[focusedIndex]?.user_companion_id}"]`);
			(nextCard as HTMLElement)?.focus();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(index - 1, 0);
			const prevCard = document.querySelector(`[data-companion-id="${companions[focusedIndex]?.user_companion_id}"]`);
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

<companion-component role="region" aria-label="Companion Selection">
	{#if !onSelect}
	<header>
		<h2 class="text-2xl font-bold">Choose Your Companion</h2>
		<p>
			Select a pre-configured companion to start chatting. You can customize or create new ones later.
		</p>
	</header>
	{/if}

	{#if isLoading}
		<p role="status">Loading companions…</p>
	{:else if error}
		<div class="status-message" data-status="critical" role="alert">
			<p>{error}</p>
		</div>
	{:else if companions.length === 0}
		<div class="empty-state" role="status">
			<p>No companions available. Please refresh or contact support.</p>
		</div>
	{:else}
		<div class="overflow-y-auto" data-testid="companion-selector">
			<companion-grid>
				{#each companions as companion, index (companion.user_companion_id)}
					<companion-card
						data-companion-id={companion.user_companion_id}
						data-testid="companion-card"
						aria-pressed={selectedId === companion.user_companion_id}
						aria-label={`Select ${companion.name} companion`}
						tabindex="0"
						role="button"
						onclick={() => handleSelect(companion)}
						onkeydown={(e: KeyboardEvent) => handleKeyDown(e, index)}
						onfocus={() => handleCardFocus(index)}
					>
							{#if companion.avatar}
									<img
										src={companion.avatar}
										alt={`${companion.name} avatar`}
										class="companion-avatar"
									/>
							{:else}
								<span
									class="companion-avatar flex items-center justify-center bg-primary text-on-primary font-bold"
									aria-label={`${companion.name} placeholder`}
								>
									{companion.name.charAt(0).toUpperCase()}
								</span>
							{/if}

							<h3 class="companion-name">
								{companion.name}
							</h3>

							{#if companion.companion_id}
								<span class="badge">Default</span>
							{:else}
								<span class="badge">Personal</span>
							{/if}

							{#if companion.description}
								<p class="companion-description">
									{companion.description}
								</p>
							{/if}

							{#if onCustomize}
									<button
										type="button"
										class="btn-secondary btn-sm"
										onclick={(e) => {
											e.stopPropagation();
											e.preventDefault();
											onCustomize(companion);
										}}
										aria-label={`Customize ${companion.name}`}
									>
										Customize
									</button>
							{/if}
					</companion-card>
				{/each}
			</companion-grid>
		</div>
	{/if}
</companion-component>
