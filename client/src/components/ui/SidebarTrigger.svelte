<script lang="ts">
    import Icon from '@iconify/svelte';
    import { uiState } from '$lib/state/ui.svelte';
    
    let { class: className = '', title = 'Open sidebar', visible = true } = $props();
</script>

{#if visible}
    <button 
        class="btn btn-square btn-ghost {className}" 
        onclick={() => uiState.toggleSidebarVisibility()}
        aria-label={title}
        {title}
    >
        <Icon icon="lucide:menu" class="inline-block w-5 h-5" />
    </button>
{/if}