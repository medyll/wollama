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
        },
    ];  
</script>

<div class="container mx-auto p-4">
    <!-- Section: Header -->
    <h1 class="text-3xl font-bold mb-6 text-center">Choisir un Compagnon</h1>
    
    <!-- Section: Companion Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each companions as compagnon}
            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border border-base-content/5">
                <div class="card-body">
                    <h2 class="card-title">{compagnon.name}</h2>
                    <p>{compagnon.description}</p>
                    <div class="card-actions justify-end mt-4">
                        <div class="badge badge-outline">{compagnon.model}</div>
                        <a href="/chat/new?companion_id={compagnon.companion_id}" class="btn btn-primary btn-sm" aria-label="Chat with {compagnon.name}">Discuter</a>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    
    <!-- Section: Footer -->
    <div class="text-center mt-8">
        <a href="/chat" class="btn btn-ghost">Retour</a>
    </div>
</div>
