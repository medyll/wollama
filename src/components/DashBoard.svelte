<script lang="ts">
    import type { Snippet } from 'svelte';

    let { showList=$bindable(false),children, home }: { showList:boolean,children: Snippet; home?: Snippet } = $props();
</script>

<div class="application-dashboard ">
    {#if !showList}
        <div class="h-full w-full flex flex-col">
            <div class="flex-1"></div>
            <!-- <div class="flex self-center text-center opacity-70">
                <Icon icon="fluent-emoji-high-contrast:llama" style="font-size:10em" />
            </div> -->
            <div class="flex-col self-center text-center p-4"></div>
            {@render home?.()}
            <div class="flex-1"></div>
        </div>
    {:else}
        {@render children?.()}
    {/if}
</div>
