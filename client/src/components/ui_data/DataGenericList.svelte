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

	async function loadData(
		table: string,
		order: string | { field: string; direction: 'asc' | 'desc' }[],
		direction: 'asc' | 'desc'
	) {
		if (!table) return;
		loading = true;
		try {
			let sortParam: any = order;
			if (Array.isArray(order)) {
				sortParam = order.map((o) => ({ [o.field]: o.direction }));
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

<data-list>
	{#if loading && items.length === 0}
		<data-list-state aria-busy="true"><span class="loading-ellipsis">Loading</span></data-list-state>
	{:else if error}
		<div class="status-message" data-status="critical" role="alert">
			<Icon icon="fluent:error-circle-24-regular" />
			<span>{error}</span>
		</div>
	{:else if items.length === 0}
		<data-list-state>
			No items found in {tableName}
		</data-list-state>
	{:else if displayType === 'card'}
		<data-card-grid>
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
		</data-card-grid>
	{:else}
		<!-- List View Fallback -->
		<div class="table-scroll">
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
						<tr data-interactive={onRowClick ? 'true' : undefined} onclick={() => onRowClick && onRowClick(item)}>
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
								<td class="table-actions">
									{#if editable}
										<button
											class="btn-icon btn-sm"
											onclick={(e) => {
												e.stopPropagation();
												onEdit && onEdit(item);
											}}
											aria-label="Edit"
										>
											<Icon icon="fluent:edit-24-regular" class="h-4 w-4" />
										</button>
									{/if}
									{#if deletable}
										<button
											class="btn-icon btn-sm action-critical"
											onclick={(e) => {
												e.stopPropagation();
												handleDelete(item);
											}}
											aria-label="Delete"
										>
											<Icon icon="fluent:delete-24-regular" class="h-4 w-4" />
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
</data-list>

<style>
	@layer components {
		data-list,
		data-list-state,
		data-card-grid {
			display: block;
		}

		data-list {
			width: 100%;
			height: 100%;
		}

		data-list-state {
			display: flex;
			min-block-size: 10rem;
			align-items: center;
			justify-content: center;
			color: var(--color-text-muted);
			text-align: center;
		}

		data-card-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
			gap: var(--gap-lg);
			padding: var(--pad-lg);
		}

		.table-scroll {
			overflow-x: auto;
		}

		tr[data-interactive='true'] {
			cursor: pointer;
		}

		tr[data-interactive='true']:hover {
			background: var(--color-surface-raised);
		}

		.table-actions {
			display: flex;
			gap: var(--gap-sm);
		}

		.action-critical {
			color: var(--color-critical);
		}
	}
</style>
