<script lang="ts">
    import type { Companion } from '$types/data';
    import { t } from '$lib/state/i18n.svelte';

    let { isOpen = $bindable(false), onSelect } = $props();

    const compagnons: Companion[] = [
        { 
            companion_id: '1', 
            name: t('ui.general_assistant'), 
            description: t('ui.general_assistant_desc'), 
            model: 'mistral',
            system_prompt: 'You are a helpful assistant.',
            created_at: Date.now()
        },
        { 
            companion_id: '2', 
            name: t('ui.expert_coder'), 
            description: t('ui.expert_coder_desc'), 
            model: 'codellama',
            system_prompt: 'You are an expert programmer.',
            created_at: Date.now()
        },
        { 
            companion_id: '3', 
            name: t('ui.translator'), 
            description: t('ui.translator_desc'), 
            model: 'llama2',
            system_prompt: 'You are a translator.',
            created_at: Date.now()
        },
    ];

    function selectCompagnon(compagnon: Companion) {
        onSelect(compagnon);
        isOpen = false;
    }
</script>

<dialog class="modal" class:modal-open={isOpen}>
    <div class="modal-box w-11/12 max-w-5xl">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={() => isOpen = false}>✕</button>
        </form>
        <h3 class="font-bold text-lg mb-4">{t('ui.choose_companion')}</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each compagnons as compagnon}
                <button class="card bg-base-200 hover:bg-base-300 transition-colors text-left" onclick={() => selectCompagnon(compagnon)}>
                    <div class="card-body p-4">
                        <h4 class="font-bold">{compagnon.name}</h4>
                        <p class="text-sm opacity-70">{compagnon.description}</p>
                        <div class="badge badge-outline mt-2">{compagnon.model}</div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={() => isOpen = false}>close</button>
    </form>
</dialog>
