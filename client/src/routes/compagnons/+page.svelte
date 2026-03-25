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

<div class="container mx-auto p-4">
	<!-- Section: Header -->
	<h1 class="mb-6 text-center text-3xl font-bold">Choisir un Compagnon</h1>

	<!-- Section: Companion Grid -->
	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="spinner">
				<div class="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"></div>
			</div>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<p>{error}</p>
		</div>
	{:else if companions.length === 0}
		<div class="alert alert-info">
			<p>No companions available</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each companions as companion (getCompanionId(companion))}
				<div class="card bg-base-100 border-base-content/5 border shadow-xl transition-shadow hover:shadow-2xl">
					<div class="card-body">
						<h2 class="card-title">{companion.name}</h2>

						<!-- Badge: System or Personal -->
						<div
							class="badge"
							class:badge-primary={isSystemCompanion(companion)}
							class:badge-secondary={!isSystemCompanion(companion)}
						>
							{isSystemCompanion(companion) ? 'Default' : 'Personal'}
						</div>

						<p class="text-sm text-gray-600">{companion.description}</p>

						<!-- Model and Specialization -->
						<div class="flex gap-2 text-xs">
							<span class="badge badge-outline">{companion.model}</span>
							{#if companion.specialization}
								<span class="badge badge-ghost">{companion.specialization}</span>
							{/if}
						</div>

						<!-- Actions -->
						<div class="card-actions mt-4 justify-between">
							<button
								class="btn btn-primary btn-sm"
								onclick={() => startChat(companion)}
								aria-label={`Chat with ${companion.name}`}
							>
								Chat
							</button>

							{#if isSystemCompanion(companion)}
								<!-- System companion: Customize button -->
								<button
									class="btn btn-secondary btn-sm"
									onclick={() => handleCustomize(companion)}
									aria-label={`Customize ${companion.name}`}
								>
									Customize
								</button>
							{:else}
								<!-- User companion: Edit button -->
								<button
									class="btn btn-accent btn-sm"
									onclick={() => handleEdit(companion)}
									aria-label={`Edit ${companion.name}`}
								>
									Edit
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Section: Footer -->
	<div class="mt-8 text-center">
		<a href="/chat" class="btn btn-ghost">Retour</a>
	</div>
</div>
