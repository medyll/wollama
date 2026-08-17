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
	<span class="loading-ellipsis" aria-label="Loading">Loading</span>
{:else if mode === 'dropdown'}
	<select class="w-full {className}" bind:value={selectedId} aria-label={label || placeholder}>
		<option value="" disabled selected>{placeholder}</option>
		{#each items as item}
			<option value={item[valueKey]}>
				{item.flag ? item.flag + ' ' : ''}{item[presentation]}
			</option>
		{/each}
	</select>
{:else if mode === 'grid'}
	<selector-grid class={className}>
		{#each items as item}
			<button class="selector-option" aria-pressed={selectedId === item[valueKey]} onclick={() => handleSelect(item)}>
				{#if item.flag}
					<span class="text-2xl">{item.flag}</span>
				{/if}
				<span class="text-xs">{item[presentation]}</span>
			</button>
		{/each}
	</selector-grid>
{:else}
	<!-- List Mode -->
	<ul class="selector-list {className}">
		{#each items as item}
			<li>
				<button aria-pressed={selectedId === item[valueKey]} onclick={() => handleSelect(item)}>
					{#if item.flag}
						<span class="mr-2 text-xl">{item.flag}</span>
					{/if}
					{item[presentation]}
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
	@layer components {
		selector-grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--gap-sm);
		}

		.selector-option,
		.selector-list button {
			border: var(--border-width) solid var(--color-border);
			background: var(--color-surface);
			color: var(--color-text);
		}

		.selector-option {
			display: flex;
			min-block-size: calc(var(--pad-lg) * 2 + var(--text-sm));
			align-items: center;
			justify-content: center;
			flex-direction: column;
			gap: var(--gap-xs);
			padding: var(--pad-sm);
			border-radius: var(--radius-md);
		}

		.selector-option[aria-pressed='true'],
		.selector-list button[aria-pressed='true'] {
			border-color: var(--color-primary);
			background: color-mix(in srgb, var(--color-primary) 10%, var(--color-surface));
			color: var(--color-primary);
		}

		.selector-list {
			display: flex;
			flex-direction: column;
			gap: var(--gap-xs);
			width: 100%;
			margin: 0;
			padding: var(--pad-sm);
			list-style: none;
			background: var(--color-surface-raised);
			border-radius: var(--radius-md);
		}

		.selector-list button {
			display: flex;
			width: 100%;
			align-items: center;
			padding: var(--pad-sm) var(--pad-md);
			border-radius: var(--radius-sm);
			text-align: start;
		}
	}
</style>
