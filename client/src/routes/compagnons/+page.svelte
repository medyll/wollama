<script lang="ts">
	import type { Companion, UserCompanion } from '$types/data';
	import { userState } from '$lib/state/user.svelte';
	import { uiState } from '$lib/state/ui.svelte';
	import { CompanionService } from '$lib/services/companion.service';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let companions: (Companion | UserCompanion)[] = $state([]);
	const companionService = new CompanionService();

	onMount(async () => {
		if (userState.uid) {
			companions = await companionService.getAll(userState.uid);
		}
	});

	function getCompanionId(c: Companion | UserCompanion): string {
		return 'user_companion_id' in c ? (c as UserCompanion).user_companion_id : c.companion_id;
	}

	function startChat(compagnon: Companion | UserCompanion) {
		uiState.setActiveCompanionId(getCompanionId(compagnon));
		goto('/chat/new');
	}
</script>

<div class="container mx-auto p-4">
	<!-- Section: Header -->
	<h1 class="mb-6 text-center text-3xl font-bold">Choisir un Compagnon</h1>

	<!-- Section: Companion Grid -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each companions as compagnon}
			<div class="card bg-base-100 border-base-content/5 border shadow-xl transition-shadow hover:shadow-2xl">
				<div class="card-body">
					<h2 class="card-title">{compagnon.name}</h2>
					<p>{compagnon.description}</p>
					<div class="card-actions mt-4 justify-end">
						<div class="badge badge-outline">{compagnon.model}</div>
						<button
							onclick={() => startChat(compagnon)}
							class="btn btn-primary btn-sm"
							aria-label="Chat with {compagnon.name}">Discuter</button
						>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Section: Footer -->
	<div class="mt-8 text-center">
		<a href="/chat" class="btn btn-ghost">Retour</a>
	</div>
</div>
