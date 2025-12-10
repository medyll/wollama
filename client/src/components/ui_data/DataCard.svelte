<script lang="ts">
    import { appSchema } from '../../../../shared/db/database-scheme';
    import { DataGenericService } from '$lib/services/data-generic.service';
    import Icon from '@iconify/svelte';
    import DataUpdate from './DataUpdate.svelte';

    let { 
        tableName,
        id = undefined,
        data = undefined,
        editable = false,
        onRowClick = undefined,
        onEdit = undefined
    } = $props();

    let item = $state<any>(undefined);
    let loading = $state(false);
    let isEditing = $state(false);

    // Get schema definition
    let tableDef = $derived(appSchema[tableName]);
    let cardLines = $derived(tableDef?.template?.card_lines || []);
    let presentationField = $derived(tableDef?.template?.presentation || 'id');
    
    let dataService = $derived(new DataGenericService(tableName));

    $effect(() => {
        if (data) {
            item = data;
        } else if (id && tableName) {
            loadDataById();
        }
    });

    async function loadDataById() {
        loading = true;
        try {
            item = await dataService.get(id);
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
                                {String(getDisplayValue(item, line))}
                            </span>
                        </div>
                    {/if}
                {/each}
            </div>
            
            <!-- Actions (Slot) -->
            <div class="card-actions justify-end mt-4">
                {#if editable}
                    <button 
                        class="btn btn-sm btn-ghost btn-circle"
                        onclick={(e) => {
                            e.stopPropagation();
                            isEditing = true;
                            onEdit && onEdit(item);
                        }}
                        aria-label="Edit"
                    >
                        <Icon icon="lucide:edit-2" class="w-4 h-4" />
                    </button>
                {/if}
                <!-- We can add a slot here later -->
            </div>
        </div>
    </div>

    {#if isEditing}
        <DataUpdate 
            {tableName} 
            id={item[tableDef.primaryKey]} 
            bind:isOpen={isEditing} 
            onSave={(newData: any) => {
                item = { ...item, ...newData };
            }}
        />
    {/if}
{/if}