<script lang="ts">
    import type { Companion } from '$types/data';
    import { t } from '$lib/state/i18n.svelte';
    import { companionService } from '$lib/services/companion.service';

    let { isOpen = $bindable(false), onSelect } = $props();
    let compagnons = $state<Companion[]>([]);

    $effect(() => {
        if (isOpen) {
            loadCompanions();
        }
    });

    async function loadCompanions() {
        try {
            compagnons = await companionService.getAll();
        } catch (e) {
            console.error('Failed to load companions:', e);
        }
    }

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
                        <div class="flex gap-2 mt-2 flex-wrap">
                            <div class="badge badge-outline">{compagnon.model}</div>
                            {#if compagnon.voice_id}
                                <div class="badge badge-ghost text-xs">Voice: {compagnon.voice_id}</div>
                            {/if}
                            {#if compagnon.voice_tone && compagnon.voice_tone !== 'neutral'}
                                <div class="badge badge-secondary badge-outline text-xs">Tone: {compagnon.voice_tone}</div>
                            {/if}
                            {#if compagnon.mood && compagnon.mood !== 'neutral'}
                                <div class="badge badge-accent badge-outline text-xs">Mood: {compagnon.mood}</div>
                            {/if}
                        </div>
                    </div>
                </button>
            {/each}
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={() => isOpen = false}>close</button>
    </form>
</dialog>
