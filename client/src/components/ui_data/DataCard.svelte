<script lang="ts">
    import { getDatabase } from '$lib/db';
    import { appSchema } from '../../../../shared/db/database-scheme';

    let { 
        tableName,
        id = undefined,
        data = undefined,
        onRowClick = undefined 
    } = $props();

    let item = $state<any>(undefined);
    let loading = $state(false);

    // Get schema definition
    let tableDef = $derived(appSchema[tableName]);
    let cardLines = $derived(tableDef?.template?.card_lines || []);
    let presentationField = $derived(tableDef?.template?.presentation || 'id');

    $effect(() => {
        if (data) {
            item = data;
        } else if (id && tableName) {
            loadData();
        }
    });

    async function loadData() {
        loading = true;
        try {
            const db = await getDatabase();
            const doc = await db[tableName].findOne(id).exec();
            if (doc) {
                const docData = doc.toJSON();
                
                // Resolve relations
                const resolvedLines: Record<string, any> = {};
                for (const line of cardLines) {
                    if (line.includes('.')) {
                        const [foreignKey, field] = line.split('.');
                        if (tableDef.fk && tableDef.fk[foreignKey]) {
                            const relatedTable = tableDef.fk[foreignKey].table;
                            const relatedId = docData[foreignKey];
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
                        resolvedLines[line] = docData[line];
                    }
                }

                item = {
                    ...docData,
                    _resolved: resolvedLines
                };
            }
        } catch (e) {
            console.error('Error loading card data:', e);
        } finally {
            loading = false;
        }
    }

    function getDisplayValue(currentItem: any, line: string) {
        if (!currentItem) return '';
        if (currentItem._resolved && currentItem._resolved[line] !== undefined) {
            return currentItem._resolved[line];
        }
        return currentItem[line];
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if loading}
    <div class="card bg-base-100 shadow-xl border border-base-200 h-40 flex items-center justify-center">
        <span class="loading loading-spinner"></span>
    </div>
{:else if item}
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
{/if}