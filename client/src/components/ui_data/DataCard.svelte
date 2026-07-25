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
	<data-card data-loading="true" aria-busy="true"><span class="loading-ellipsis">Loading</span></data-card>
{:else if item}
	<data-card
		data-interactive={onRowClick ? 'true' : undefined}
		onclick={() => onRowClick && onRowClick(item)}
	>
		<data-card-body>
			<!-- Header / Title -->
			<h2>
				{item[presentationField] || 'Untitled'}
			</h2>

			<!-- Card Lines -->
			<data-card-details>
				{#each cardLines as line}
					{#if line !== presentationField}
						<div class="data-line">
							<span class="data-label">{line.split('.').pop()}:</span>
							<span class="data-value">
								{String(getDisplayValue(item, line))}
							</span>
						</div>
					{/if}
				{/each}
			</data-card-details>
			<!-- Actions (Slot) -->
			<data-card-actions>
				{#if editable}
					<button
						class="btn-icon btn-sm"
						onclick={(e) => {
							e.stopPropagation();
							if (onEdit) {
								// If parent provides onEdit callback, let parent handle the modal
								onEdit(item);
							} else {
								// Otherwise, handle editing internally
								isEditing = true;
							}
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
							onDelete && onDelete(item);
						}}
						aria-label="Delete"
					>
						<Icon icon="fluent:delete-24-regular" class="h-4 w-4" />
					</button>
				{/if}
				<!-- We can add a slot here later -->
			</data-card-actions>
		</data-card-body>
	</data-card>

	<!-- Internal modal: only used if no onEdit callback is provided -->
	{#if isEditing && !onEdit}
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

<style>
	@layer components {
		data-card {
			display: flex;
			min-block-size: 10rem;
			background: var(--color-surface);
			border: var(--border-width) solid var(--color-border);
			border-radius: var(--radius-lg);
			box-shadow: var(--shadow-sm);
			overflow: hidden;
			transition: background-color var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast);
		}

		data-card[data-loading='true'] {
			align-items: center;
			justify-content: center;
		}

		data-card[data-interactive='true'] {
			cursor: pointer;
		}

		data-card[data-interactive='true']:hover {
			background: var(--color-surface-raised);
			box-shadow: var(--shadow-md);
			transform: translateY(-1px);
		}

		data-card-body {
			display: flex;
			flex: 1;
			flex-direction: column;
			padding: var(--pad-lg);
		}

		data-card-body h2 {
			margin: 0 0 var(--gap-sm);
			font-size: var(--text-lg);
		}

		data-card-details,
		data-card-actions {
			display: flex;
		}

		data-card-details {
			flex-direction: column;
			gap: var(--gap-xs);
		}

		.data-line {
			display: grid;
			grid-template-columns: minmax(5rem, auto) minmax(0, 1fr);
			gap: var(--gap-sm);
			font-size: var(--text-sm);
		}

		.data-label {
			color: var(--color-text-muted);
			text-transform: capitalize;
		}

		.data-value {
			overflow: hidden;
			font-weight: var(--font-medium);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		data-card-actions {
			justify-content: flex-end;
			gap: var(--gap-xs);
			margin-block-start: auto;
			padding-block-start: var(--pad-md);
		}

		.action-critical {
			color: var(--color-critical);
		}
	}
</style>
