<script lang="ts">
    import { appSchema } from '../../../../shared/db/database-scheme';
    import Icon from '@iconify/svelte';
    import DataCard from './DataCard.svelte';
    import { DataGenericService } from '$lib/services/data-generic.service';

    let { 
        tableName, 
        orderBy = 'updated_at', 
        orderDirection = 'desc', 
        displayType = 'card',
        editable = false,
        onRowClick = undefined,
        onEdit = undefined
    } = $props();

    let items = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Get schema definition for the table
    let tableDef = $derived(appSchema[tableName]);
    let cardLines = $derived(tableDef?.template?.card_lines || []);
    let presentationField = $derived(tableDef?.template?.presentation || 'id');
    
    let dataService = $derived(new DataGenericService(tableName));

    $effect(() => {
        loadData(tableName, orderBy, orderDirection as 'asc' | 'desc');
    });

    async function loadData(table: string, order: string, direction: 'asc' | 'desc') {
        if (!table) return;
        loading = true;
        try {
            const query = await dataService.getListQuery(order, direction);

            // Subscribe to data
            query.$.subscribe(async (docs: any[]) => {
                items = await dataService.processDocs(docs);
                loading = false;
            });

        } catch (e) {
            console.error('Error loading data:', e);
            error = e instanceof Error ? e.message : 'Unknown error';
            loading = false;
        }
    }

    function getDisplayValue(item: any, line: string) {
        if (item._resolved && item._resolved[line] !== undefined) {
            return item._resolved[line];
        }
        return item[line];
    }
</script>

<div class="w-full h-full">
    {#if loading && items.length === 0}
        <div class="flex justify-center items-center h-40">
            <span class="loading loading-spinner loading-lg"></span>
        </div>
    {:else if error}
        <div class="alert alert-error">
            <Icon icon="lucide:alert-circle" />
            <span>{error}</span>
        </div>
    {:else if items.length === 0}
        <div class="text-center opacity-50 py-10">
            No items found in {tableName}
        </div>
    {:else}
        {#if displayType === 'card'}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {#each items as item}
                    <DataCard 
                        {tableName}
                        data={item}
                        {editable}
                        {onEdit}
                        {onRowClick} 
                    />
                {/each}
            </div>
        {:else}
            <!-- List View Fallback -->
            <div class="overflow-x-auto">
                <table class="table">
                    <thead>
                        <tr>
                            <th>{presentationField}</th>
                            {#each cardLines as line}
                                {#if line !== presentationField}
                                    <th>{line}</th>
                                {/if}
                            {/each}
                            {#if editable}
                                <th>Actions</th>
                            {/if}
                        </tr>
                    </thead>
                    <tbody>
                        {#each items as item}
                            <tr 
                                class="hover {onRowClick ? 'cursor-pointer' : ''}" 
                                onclick={() => onRowClick && onRowClick(item)}
                            >
                                <td class="font-bold">{item[presentationField]}</td>
                                {#each cardLines as line}
                                    {#if line !== presentationField}
                                        <td>{getDisplayValue(item, line)}</td>
                                    {/if}
                                {/each}
                                {#if editable}
                                    <td>
                                        <button 
                                            class="btn btn-sm btn-ghost btn-circle"
                                            onclick={(e) => {
                                                e.stopPropagation();
                                                onEdit && onEdit(item);
                                            }}
                                            aria-label="Edit"
                                        >
                                            <Icon icon="lucide:edit-2" class="w-4 h-4" />
                                        </button>
                                    </td>
                                {/if}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>