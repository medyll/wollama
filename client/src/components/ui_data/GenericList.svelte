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
        deletable = false,
        onRowClick = undefined,
        onEdit = undefined,
        onDelete = undefined
    } = $props();

    let items = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Get schema definition for the table
    let tableDef = $derived(appSchema[tableName]);
    let cardLines = $derived(tableDef?.template?.card_lines || []);
    let presentationField = $derived(tableDef?.template?.presentation || 'id');
    
    let tableColumns = $derived.by(() => {
        if (tableDef?.template?.table_columns) {
            return tableDef.template.table_columns;
        }
        if (tableDef?.template?.card_lines && tableDef.template.card_lines.length > 0) {
            return tableDef.template.card_lines;
        }
        return [presentationField];
    });

    let dataService = $derived(new DataGenericService(tableName));

    $effect(() => {
        loadData(tableName, orderBy, orderDirection as 'asc' | 'desc');
    });

    async function loadData(table: string, order: string | { field: string, direction: 'asc' | 'desc' }[], direction: 'asc' | 'desc') {
        if (!table) return;
        loading = true;
        try {
            let sortParam: any = order;
            if (Array.isArray(order)) {
                sortParam = order.map(o => ({ [o.field]: o.direction }));
            }

            const query = await dataService.getListQuery(sortParam, direction);

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

    async function handleDelete(item: any) {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            const id = item[tableDef.primaryKey];
            await dataService.delete(id);
            if (onDelete) onDelete(item);
        } catch (e) {
            console.error('Error deleting item:', e);
            error = e instanceof Error ? e.message : 'Unknown error';
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
                        {deletable}
                        {onEdit}
                        onDelete={() => handleDelete(item)}
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
                            {#each tableColumns as col}
                                <th class="capitalize">{col.split('.').pop()}</th>
                            {/each}
                            {#if editable || deletable}
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
                                {#each tableColumns as col}
                                    <td>
                                        {#if col === presentationField}
                                            <span class="font-bold">{getDisplayValue(item, col)}</span>
                                        {:else}
                                            {getDisplayValue(item, col)}
                                        {/if}
                                    </td>
                                {/each}
                                {#if editable || deletable}
                                    <td class="flex gap-2">
                                        {#if editable}
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
                                        {/if}
                                        {#if deletable}
                                            <button 
                                                class="btn btn-sm btn-ghost btn-circle text-error"
                                                onclick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item);
                                                }}
                                                aria-label="Delete"
                                            >
                                                <Icon icon="lucide:trash-2" class="w-4 h-4" />
                                            </button>
                                        {/if}
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