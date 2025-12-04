<script lang="ts">
    import { GenericService } from '$lib/services/generic.service';
    import { createEventDispatcher } from 'svelte';
    import Icon from '@iconify/svelte';
    import { goto } from '$app/navigation';

    let { 
        table, 
        table_id, 
        mode = 'create', 
        confirm = false, 
        icon = null,
        onSuccess = () => {}
    } = $props();

    let isConfirming = $state(false);
    let isLoading = $state(false);

    const dispatch = createEventDispatcher();
    const service = new GenericService(table);

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

    const defaultIcon = mode === 'delete' ? 'lucide:trash-2' : 'lucide:plus';
    const displayIcon = icon || defaultIcon;
</script>

<div class="relative inline-block">
    <!-- Section: Confirmation Overlay -->
    {#if isConfirming}
        <div class="flex items-center gap-2 bg-error/10 text-error rounded-lg p-1 pr-2 absolute right-0 top-0 h-full z-10 whitespace-nowrap overflow-hidden animate-in slide-in-from-right-4 fade-in duration-200">
            <button class="btn btn-xs btn-ghost btn-circle" onclick={cancel} aria-label="Cancel">
                <Icon icon="lucide:x" class="w-4 h-4" />
            </button>
            <span class="text-xs font-bold">Confirm?</span>
            <button class="btn btn-xs btn-error" onclick={handleClick} disabled={isLoading} aria-label="Confirm">
                {#if isLoading}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else}
                    <Icon icon="lucide:check" class="w-4 h-4" />
                {/if}
            </button>
        </div>
    {/if}

    <!-- Section: Main Button -->
    <button 
        class="btn btn-ghost btn-sm btn-circle {isConfirming ? 'opacity-0 pointer-events-none' : ''} transition-opacity"
        onclick={handleClick}
        aria-label={mode}
    >
        <Icon icon={displayIcon} class="w-5 h-5" />
    </button>
</div>
