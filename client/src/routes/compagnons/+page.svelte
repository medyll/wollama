<script lang="ts">
    // Mock Data
    const compagnons = [
        { id: '1', name: 'Assistant Général', description: 'Un assistant polyvalent pour toutes vos tâches.', model: 'mistral' },
        { id: '2', name: 'Codeur Expert', description: 'Spécialisé en développement logiciel.', model: 'codellama' },
        { id: '3', name: 'Traducteur', description: 'Traduit vos textes en plusieurs langues.', model: 'llama2' },
    ];
</script>

<div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6 text-center">Choisir un Compagnon</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each compagnons as compagnon}
            <div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer border border-base-content/5">
                <div class="card-body">
                    <h2 class="card-title">{compagnon.name}</h2>
                    <p>{compagnon.description}</p>
                    <div class="card-actions justify-end mt-4">
                        <div class="badge badge-outline">{compagnon.model}</div>
                        <a href="/chat/new?compagnon={compagnon.id}" class="btn btn-primary btn-sm">Discuter</a>
                    </div>
                </div>
            </div>
        {/each}
    </div>
    
    <div class="text-center mt-8">
        <a href="/chat" class="btn btn-ghost">Retour</a>
    </div>
</div>
