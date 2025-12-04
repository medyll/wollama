<script lang="ts">
    import { getDatabase } from '$lib/db';
    import { appSchema } from '../../../../shared/db/database-scheme';
    import Icon from '@iconify/svelte';

    let { 
        tableName, 
        orderBy = 'updated_at', 
        orderDirection = 'desc', 
        displayType = 'card',
        onRowClick = undefined
    } = $props();

    let items = $state<any[]>([]);
    let loading = $state(true);
    let error = $state<string | null>(null);

    // Get schema definition for the table
    let tableDef = $derived(appSchema[tableName]);
    let cardLines = $derived(tableDef?.template?.card_lines || []);
    let presentationField = $derived(tableDef?.template?.presentation || 'id');

    $effect(() => {
        loadData(tableName, orderBy, orderDirection);
    });

    async function loadData(table: string, order: string, direction: string) {
        if (!table) return;
        loading = true;
        try {
            const db = await getDatabase();
            if (!db[table]) {
                error = `Table ${table} not found in database`;
                loading = false;
                return;
            }

            // Build query
            let query = db[table].find();
            
            // Apply sort if field exists in schema
            // Note: RxDB requires the sort field to be indexed
            if (order && tableDef.fields[order]) {
                // RxDB sort direction: 'asc' | 'desc'
                const sortDir = direction === 'asc' ? 'asc' : 'desc';
                query = query.sort({ [order]: sortDir });
            }

            // Subscribe to data
            query.$.subscribe(async (docs: any[]) => {
                // Process documents to resolve relations if needed
                const processedItems = await Promise.all(docs.map(async (doc) => {
                    const data = doc.toJSON();
                    
                    // Resolve relations for card_lines
                    // Example: 'companion_id.name'
                    const resolvedLines: Record<string, any> = {};
                    
                    for (const line of cardLines) {
                        if (line.includes('.')) {
                            const [foreignKey, field] = line.split('.');
                            // Check if it's a relation
                            if (tableDef.fk && tableDef.fk[foreignKey]) {
                                const relatedTable = tableDef.fk[foreignKey].table;
                                const relatedId = data[foreignKey];
                                if (relatedId) {
                                    try {
                                        const relatedDoc = await db[relatedTable].findOne(relatedId).exec();
                                        if (relatedDoc) {
                                            resolvedLines[line] = relatedDoc[field];
                                        }
                                    } catch (e) {
                                        console.warn(`Failed to resolve relation ${line}`, e);
                                    }
                                }
                            }
                        } else {
                            resolvedLines[line] = data[line];
                        }
                    }
                    
                    return {
                        ...data,
                        _resolved: resolvedLines
                    };
                }));
                
                items = processedItems;
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
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div 
                        class="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-all {onRowClick ? 'cursor-pointer hover:bg-base-200' : ''}"
                        onclick={() => onRowClick && onRowClick(item)}
                    >
                        <div class="card-body p-5">
                            <!-- Header / Title -->
                            <h2 class="card-title text-lg mb-2">
                                {item[presentationField] || 'Untitled'}
                            </h2>

                            <!-- Card Lines -->
                            <div class="space-y-1">
                                {#each cardLines as line}
                                    {#if line !== presentationField}
                                        <div class="text-sm flex items-start gap-2">
                                            <span class="opacity-60 capitalize min-w-20">{line.split('.').pop()}:</span>
                                            <span class="font-medium truncate">
                                                {getDisplayValue(item, line)}
                                            </span>
                                        </div>
                                    {/if}
                                {/each}
                            </div>
                            
                            <!-- Actions (Slot) -->
                            <div class="card-actions justify-end mt-4">
                                <!-- We can add a slot here later -->
                            </div>
                        </div>
                    </div>
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
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>