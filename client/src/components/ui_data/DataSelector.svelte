<script lang="ts">
    import { appSchema } from '../../../../shared/db/database-scheme';
    import { DataGenericService } from '$lib/services/data-generic.service';
    import Icon from '@iconify/svelte';

    let { 
        tableName, 
        selectedId = $bindable(),
        mode = 'dropdown', // 'dropdown' | 'grid' | 'list'
        displayField = undefined,
        valueField = undefined,
        label = '',
        placeholder = 'Select...',
        class: className = ''
    } = $props();

    let items = $state<any[]>([]);
    let loading = $state(true);
    
    // Get schema definition
    let tableDef = $derived(appSchema[tableName]);
    let pk = $derived(tableDef?.primaryKey || 'id');
    let presentation = $derived(displayField || tableDef?.template?.presentation || 'name');
    let valueKey = $derived(valueField || pk);
    
    let dataService = $derived(new DataGenericService(tableName));

    $effect(() => {
        loadData();
    });

    async function loadData() {
        if (!tableName) return;
        loading = true;
        try {
            const query = await dataService.getListQuery(presentation, 'asc');
            query.$.subscribe(async (docs: any[]) => {
                items = await dataService.processDocs(docs);
                loading = false;
            });
        } catch (e) {
            console.error('Error loading data for selector:', e);
            loading = false;
        }
    }

    function handleSelect(item: any) {
        selectedId = item[valueKey];
    }
</script>

{#if loading}
    <span class="loading loading-spinner loading-sm"></span>
{:else}
    {#if mode === 'dropdown'}
        <select 
            class="select select-bordered w-full {className}" 
            bind:value={selectedId}
            aria-label={label || placeholder}
        >
            <option value="" disabled selected>{placeholder}</option>
            {#each items as item}
                <option value={item[valueKey]}>
                    {item.flag ? item.flag + ' ' : ''}{item[presentation]}
                </option>
            {/each}
        </select>
    {:else if mode === 'grid'}
        <div class="grid grid-cols-2 gap-2 {className}">
            {#each items as item}
                <button 
                    class="btn btn-outline h-auto py-2 flex flex-col gap-1 {selectedId === item[valueKey] ? 'btn-active' : ''}"
                    onclick={() => handleSelect(item)}
                >
                    {#if item.flag}
                        <span class="text-2xl">{item.flag}</span>
                    {/if}
                    <span class="text-xs">{item[presentation]}</span>
                </button>
            {/each}
        </div>
    {:else}
        <!-- List Mode -->
        <ul class="menu bg-base-200 w-full rounded-box {className}">
            {#each items as item}
                <li>
                    <button 
                        class:active={selectedId === item[valueKey]}
                        onclick={() => handleSelect(item)}
                    >
                        {#if item.flag}
                            <span class="text-xl mr-2">{item.flag}</span>
                        {/if}
                        {item[presentation]}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
{/if}