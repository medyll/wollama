<script lang="ts">
    let { isOpen = $bindable(false), onSelect } = $props();

    const personas = [
        { id: '1', name: 'Assistant Général', description: 'Un assistant polyvalent pour toutes vos tâches.', model: 'mistral' },
        { id: '2', name: 'Codeur Expert', description: 'Spécialisé en développement logiciel.', model: 'codellama' },
        { id: '3', name: 'Traducteur', description: 'Traduit vos textes en plusieurs langues.', model: 'llama2' },
    ];

    function selectPersona(persona: any) {
        onSelect(persona);
        isOpen = false;
    }
</script>

<dialog class="modal" class:modal-open={isOpen}>
    <div class="modal-box w-11/12 max-w-5xl">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={() => isOpen = false}>✕</button>
        </form>
        <h3 class="font-bold text-lg mb-4">Choisir un Interlocuteur</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each personas as persona}
                <button class="card bg-base-200 hover:bg-base-300 transition-colors text-left" onclick={() => selectPersona(persona)}>
                    <div class="card-body p-4">
                        <h4 class="font-bold">{persona.name}</h4>
                        <p class="text-sm opacity-70">{persona.description}</p>
                        <div class="badge badge-outline mt-2">{persona.model}</div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={() => isOpen = false}>close</button>
    </form>
</dialog>
