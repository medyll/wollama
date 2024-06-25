<script lang="ts">
    import { ui } from '$lib/stores/ui';
    import Icon from '@iconify/svelte'; 
    import type { Snippet } from 'svelte';

    let { children, home }: { children: Snippet; home?: Snippet } = $props();
</script>

<div class="flex-1 px-8 flex-v h-full">
    {#if !$ui.activeChatId}
        <div class="h-full w-full flex flex-col">
            <div class="flex-1"></div>
            <div class="flex self-center text-center opacity-70">
                <Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
            </div>
            <div class="flex-col self-center text-center p-4"></div>
            {@render home?.()}
            <div class="flex-1"></div>
        </div>
    {:else}
        {@render children?.()}
    {/if}
</div>
