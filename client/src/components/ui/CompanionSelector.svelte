<script lang="ts">
    import type { Companion } from '$types/data';
    import { t } from '$lib/state/i18n.svelte';
    import GenericList from '$components/ui_data/GenericList.svelte';

    let { isOpen = $bindable(false), onSelect } = $props();

    function selectCompagnon(compagnon: Companion) {
        onSelect(compagnon);
        isOpen = false;
    }
</script>

<dialog class="modal" class:modal-open={isOpen} aria-labelledby="companion-modal-title">
    <div class="modal-box w-11/12 max-w-5xl h-[80vh] flex flex-col">
        <form method="dialog">
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onclick={() => isOpen = false} aria-label="Close">✕</button>
        </form>
        <h3 id="companion-modal-title" class="font-bold text-lg mb-4 flex-none">{t('ui.choose_companion')}</h3>
        
        <div class="flex-1 overflow-y-auto">
            <GenericList 
                tableName="companions" 
                displayType="card"
                orderBy="name" 
                orderDirection="asc"
                onRowClick={selectCompagnon}
            />
        </div>
    </div>
    <form method="dialog" class="modal-backdrop">
        <button onclick={() => isOpen = false}>close</button>
    </form>
</dialog>
