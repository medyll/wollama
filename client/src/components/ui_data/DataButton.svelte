<script lang="ts">
	import { DataGenericService } from '$lib/services/data-generic.service';
	import { createEventDispatcher } from 'svelte';
	import Icon from '@iconify/svelte';
	import { goto } from '$app/navigation';

	let { table, table_id, mode = 'create', confirm = false, icon = null, onSuccess = () => {} } = $props();

	let isConfirming = $state(false);
	let isLoading = $state(false);

	const dispatch = createEventDispatcher();
	const service = $derived(new DataGenericService(table));

	async function handleClick() {
		if (confirm && !isConfirming) {
			isConfirming = true;
			return;
		}

		isLoading = true;
		try {
			if (mode === 'delete') {
				await service.delete(table_id);
				onSuccess();
				dispatch('success');
				// If we are in a chat page and delete the chat, we might want to redirect
				if (table === 'chats') {
					goto('/');
				}
			} else if (mode === 'create') {
				// Create logic would typically require data, but the prompt implies a simple trigger
				// For now, we'll just dispatch or call create with empty object if that's the intent
				// But usually create needs data. The prompt says "lance une suppression de données concerné" for confirm.
				// It doesn't specify create behavior in detail. I'll assume it's mostly for delete based on context.
				// If create is needed, it might be for creating a new empty chat?
				// For now, I'll focus on delete as requested for the chat button.
			}
		} catch (e) {
			console.error('Action failed', e);
		} finally {
			isLoading = false;
			isConfirming = false;
		}
	}

	function cancel() {
		isConfirming = false;
	}

	const defaultIcon = $derived(mode === 'delete' ? 'lucide:trash-2' : 'lucide:plus');
	const displayIcon = $derived(icon || defaultIcon);
</script>

<div class="data-action">
	<!-- Section: Confirmation Overlay -->
	{#if isConfirming}
		<div class="data-action-confirmation">
			<button class="btn-icon btn-sm" onclick={cancel} aria-label="Cancel">
				<Icon icon="fluent:dismiss-24-regular" class="h-4 w-4" />
			</button>
			<span class="text-xs font-bold">Confirm?</span>
			<button class="btn-danger btn-sm" onclick={handleClick} disabled={isLoading} aria-label="Confirm">
				{#if isLoading}
					<span aria-hidden="true">…</span>
				{:else}
					<Icon icon="fluent:checkmark-24-regular" class="h-4 w-4" />
				{/if}
			</button>
		</div>
	{/if}

	<!-- Section: Main Button -->
	<button class="btn-icon btn-sm" class:opacity-0={isConfirming} onclick={handleClick} aria-label={mode}>
		<Icon icon={displayIcon} class="h-5 w-5" />
	</button>
</div>

<style>
	.data-action {
		position: relative;
		display: inline-block;
	}

	.data-action-confirmation {
		position: absolute;
		top: 0;
		right: 0;
		display: flex;
		height: 100%;
		align-items: center;
		gap: var(--gap-xs);
		padding: var(--pad-xs);
		border-radius: var(--radius-sm);
		background: color-mix(in oklch, var(--color-critical) 12%, var(--color-surface-overlay));
		color: var(--color-critical);
		white-space: nowrap;
		z-index: var(--z-dropdown);
	}
</style>
