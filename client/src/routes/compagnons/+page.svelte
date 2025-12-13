<script lang="ts">
	import type { Companion } from '$types/data';
	import { userState } from '$lib/state/user.svelte';

	// Mock Data
	const companions: Companion[] = [
		{
			companion_id: '1',
			name: 'Assistant Général',
			description: 'Un assistant polyvalent pour toutes vos tâches.',
			model: userState.preferences.defaultModel,
			system_prompt: 'You are a helpful assistant.',
			created_at: Date.now()
		},
		{
			companion_id: '2',
			name: 'Codeur Expert',
			description: 'Spécialisé en développement logiciel.',
			model: 'codellama',
			system_prompt: 'You are an expert programmer.',
			created_at: Date.now()
		},
		{
			companion_id: '3',
			name: 'Traducteur',
			description: 'Traduit vos textes en plusieurs langues.',
			model: 'llama2',
			system_prompt: 'You are a translator.',
			created_at: Date.now()
		}
	];
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
						<a
							href="/chat/new?companion_id={compagnon.companion_id}"
							class="btn btn-primary btn-sm"
							aria-label="Chat with {compagnon.name}">Discuter</a
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
