<script lang="ts">
    import Icon from '@iconify/svelte';
    import { toast } from '$lib/state/notifications.svelte';
    import { t } from '$lib/state/i18n.svelte';

    let { message, onRegenerate } = $props();
    let isCopied = $state(false);
    let rating = $state<'good' | 'bad' | null>(null);

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(message.content);
            isCopied = true;
            toast.success(t('ui.copied_to_clipboard') || 'Copied to clipboard');
            setTimeout(() => isCopied = false, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            toast.error('Failed to copy');
        }
    }

    function handleRate(value: 'good' | 'bad') {
        if (rating === value) {
            rating = null;
        } else {
            rating = value;
        }
        // TODO: Persist rating
    }
</script>

<div class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <!-- Rating -->
    <div class="join">
        <button 
            class="btn btn-ghost btn-xs btn-square join-item {rating === 'good' ? 'text-success' : ''}" 
            onclick={() => handleRate('good')}
            title="Good response"
        >
            <Icon icon={rating === 'good' ? "lucide:thumbs-up" : "lucide:thumbs-up"} class="w-4 h-4" />
        </button>
        <button 
            class="btn btn-ghost btn-xs btn-square join-item {rating === 'bad' ? 'text-error' : ''}" 
            onclick={() => handleRate('bad')}
            title="Bad response"
        >
            <Icon icon={rating === 'bad' ? "lucide:thumbs-down" : "lucide:thumbs-down"} class="w-4 h-4" />
        </button>
    </div>

    <div class="divider divider-horizontal mx-0"></div>

    <!-- Copy -->
    <button 
        class="btn btn-ghost btn-xs btn-square" 
        onclick={copyToClipboard}
        title="Copy"
    >
        {#if isCopied}
            <Icon icon="lucide:check" class="w-4 h-4 text-success" />
        {:else}
            <Icon icon="lucide:copy" class="w-4 h-4" />
        {/if}
    </button>

    <!-- Reload (only if onRegenerate is provided) -->
    {#if onRegenerate}
        <button 
            class="btn btn-ghost btn-xs btn-square" 
            onclick={onRegenerate}
            title="Regenerate"
        >
            <Icon icon="lucide:refresh-cw" class="w-4 h-4" />
        </button>
    {/if}

    <!-- Share -->
    <button 
        class="btn btn-ghost btn-xs btn-square" 
        title="Share"
    >
        <Icon icon="lucide:share-2" class="w-4 h-4" />
    </button>
</div>
