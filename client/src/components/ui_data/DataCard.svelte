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
		deletable = false,
		onRowClick = undefined,
		onEdit = undefined,
		onDelete = undefined
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
	<div class="card bg-base-100 border-base-200 flex h-40 items-center justify-center border shadow-xl">
		<span class="loading loading-spinner"></span>
	</div>
{:else if item}
	<div
		class="card bg-base-100 border-base-200 border shadow-xl transition-all hover:shadow-2xl {onRowClick
			? 'hover:bg-base-200 cursor-pointer'
			: ''}"
		onclick={() => onRowClick && onRowClick(item)}
	>
		<div class="card-body p-5">
			<!-- Header / Title -->
			<h2 class="card-title mb-2 text-lg">
				{item[presentationField] || 'Untitled'}
			</h2>

			<!-- Card Lines -->
			<div class="space-y-1">
				{#each cardLines as line}
					{#if line !== presentationField}
						<div class="flex items-start gap-2 text-sm">
							<span class="min-w-20 capitalize opacity-60">{line.split('.').pop()}:</span>
							<span class="truncate font-medium">
								{String(getDisplayValue(item, line))}
							</span>
						</div>
					{/if}
				{/each}
			</div>

			<!-- Actions (Slot) -->
			<div class="card-actions mt-4 justify-end">
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
						<Icon icon="lucide:edit-2" class="h-4 w-4" />
					</button>
				{/if}
				{#if deletable}
					<button
						class="btn btn-sm btn-ghost btn-circle text-error"
						onclick={(e) => {
							e.stopPropagation();
							onDelete && onDelete(item);
						}}
						aria-label="Delete"
					>
						<Icon icon="lucide:trash-2" class="h-4 w-4" />
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
