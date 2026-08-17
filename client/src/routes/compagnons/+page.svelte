<script lang="ts">
	import type { Companion, UserCompanion } from '$types/data';
	import { userState } from '$lib/state/user.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { companionService } from '$lib/services/companion.service';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let companions: (Companion | UserCompanion)[] = $state([]);
	let isLoading = $state(true);
	let error: string | null = $state(null);

	onMount(async () => {
		try {
			isLoading = true;
			if (userState.uid) {
				companions = await companionService.getAll(userState.uid);
			}
		} catch (err) {
			error = `Failed to load companions: ${err instanceof Error ? err.message : String(err)}`;
			console.error('Error loading companions:', err);
		} finally {
			isLoading = false;
		}
	});

	function getCompanionId(c: Companion | UserCompanion): string {
		return 'user_companion_id' in c ? (c as UserCompanion).user_companion_id : c.companion_id;
	}

	function isSystemCompanion(c: Companion | UserCompanion): c is Companion {
		return 'is_locked' in c && c.is_locked === true;
	}

	function startChat(companion: Companion | UserCompanion) {
		uiState.setActiveCompanionId(getCompanionId(companion));
		goto('/chat/new');
	}

	function handleCustomize(companion: Companion | UserCompanion) {
		const companionId = getCompanionId(companion);
		goto(`/compagnons/customize?id=${companionId}&new=true`);
	}

	function handleEdit(companion: Companion | UserCompanion) {
		const companionId = getCompanionId(companion);
		goto(`/compagnons/customize?id=${companionId}&new=false`);
	}
</script>

<companions-page>
	<!-- Section: Header -->
	<header class="page-header">
		<div class="page-header-copy">
			<h1>Choisir un compagnon</h1>
			<p class="page-description">Sélectionnez la personnalité et le modèle les mieux adaptés à votre conversation.</p>
		</div>
	</header>

	<!-- Section: Companion Grid -->
	{#if isLoading}
		<companions-state aria-busy="true"><span class="loading-ellipsis">Loading companions</span></companions-state>
	{:else if error}
		<div class="status-message" data-status="critical" role="alert">
			<p>{error}</p>
		</div>
	{:else if companions.length === 0}
		<div class="status-message" data-status="info">
			<p>No companions available</p>
		</div>
	{:else}
		<companions-grid>
			{#each companions as companion (getCompanionId(companion))}
				<companion-card>
					<companion-card-body>
						<h2>{companion.name}</h2>

						<!-- Badge: System or Personal -->
						<div class="companion-kind" data-kind={isSystemCompanion(companion) ? 'default' : 'personal'}>
							{isSystemCompanion(companion) ? 'Default' : 'Personal'}
						</div>

						<p class="text-muted text-sm">{companion.description}</p>

						<!-- Model and Specialization -->
						<div class="flex gap-2 text-xs">
							<span class="metadata-pill">{companion.model}</span>
							{#if companion.specialization}
								<span class="metadata-pill">{companion.specialization}</span>
							{/if}
						</div>

						<!-- Actions -->
						<companion-actions>
							<button
								class="btn-primary btn-sm"
								onclick={() => startChat(companion)}
								aria-label={`Chat with ${companion.name}`}
							>
								Chat
							</button>

							{#if isSystemCompanion(companion)}
								<!-- System companion: Customize button -->
								<button
									class="btn-secondary btn-sm"
									onclick={() => handleCustomize(companion)}
									aria-label={`Customize ${companion.name}`}
								>
									Customize
								</button>
							{:else}
								<!-- User companion: Edit button -->
								<button
									class="btn-outline btn-sm"
									onclick={() => handleEdit(companion)}
									aria-label={`Edit ${companion.name}`}
								>
									Edit
								</button>
							{/if}
						</companion-actions>
					</companion-card-body>
				</companion-card>
			{/each}
		</companions-grid>
	{/if}

	<!-- Section: Footer -->
	<div class="mt-8 text-center">
		<a href="/chat" class="btn-ghost">Retour</a>
	</div>
</companions-page>

<style>
	@layer components {
		companions-page,
		companions-state,
		companions-grid,
		companion-card,
		companion-card-body,
		companion-actions {
			display: flex;
		}

		companions-page {
			width: min(100%, 76rem);
			height: 100%;
			margin-inline: auto;
			padding: var(--pad-xl);
			flex-direction: column;
			overflow-y: auto;
		}

		companions-state {
			min-height: 16rem;
			align-items: center;
			justify-content: center;
		}

		companions-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
			gap: var(--gap-lg);
		}

		companion-card {
			background: var(--color-surface-raised);
			border: var(--border-width) solid var(--wollama-border-subtle);
			border-radius: var(--radius-xl);
			box-shadow: var(--shadow-sm);
			transition:
				box-shadow var(--transition-fast),
				transform var(--transition-fast);
		}

		companion-card:hover {
			box-shadow: var(--shadow-md);
			transform: translateY(-1px);
		}

		companion-card-body {
			width: 100%;
			flex-direction: column;
			gap: var(--gap-md);
			padding: var(--pad-lg);
		}

		companion-card-body h2 {
			margin: 0;
		}

		.companion-kind,
		.metadata-pill {
			display: inline-flex;
			align-self: flex-start;
			padding: var(--pad-xs) var(--pad-sm);
			border-radius: var(--radius-full);
			font-size: var(--text-xs);
			font-weight: var(--font-medium);
		}

		.companion-kind {
			background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
			color: var(--color-primary);
		}

		.companion-kind[data-kind='personal'] {
			background: color-mix(in srgb, var(--color-secondary) 12%, var(--color-surface));
			color: var(--color-secondary);
		}

		.metadata-pill {
			border: var(--border-width) solid var(--color-border);
			color: var(--color-text-muted);
		}

		companion-actions {
			justify-content: space-between;
			gap: var(--gap-sm);
			margin-block-start: auto;
			padding-block-start: var(--pad-sm);
		}

		@media (width < 48rem) {
			companions-page {
				padding: var(--pad-md);
			}
		}
	}
</style>
