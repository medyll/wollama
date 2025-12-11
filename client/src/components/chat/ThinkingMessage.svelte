<script lang="ts">
    import { parseMarkdown } from '$lib/utils/markdown';
    import { parseThinking } from '$lib/utils/thinking';
    import Icon from '@iconify/svelte';

    let { content } = $props();

    let parsed = $derived(parseThinking(content));

    let isOpen = $state(true);
    
    // Auto-close when thinking is done
    $effect(() => {
        if (!parsed.isThinking && parsed.thinking) {
            isOpen = false;
        } else if (parsed.isThinking) {
            isOpen = true;
        }
    });
</script>

<div class="flex flex-col gap-2">
    {#if parsed.pre}
        <div class="prose prose-sm max-w-none dark:prose-invert wrap-break-word">
            {@html parseMarkdown(parsed.pre)}
        </div>
    {/if}

    {#if parsed.thinking !== null}
        <div class="collapse collapse-arrow bg-base-200/50 border border-base-300/50 rounded-xl overflow-hidden">
            <input type="checkbox" bind:checked={isOpen} /> 
            <div class="collapse-title text-xs font-medium flex items-center gap-2 opacity-70 py-2 min-h-0">
                <Icon icon="lucide:brain-circuit" class="w-4 h-4 {parsed.isThinking ? 'animate-pulse text-primary' : ''}" />
                <span>{parsed.isThinking ? 'Thinking...' : 'Thought Process'}</span>
            </div>
            <div class="collapse-content text-sm opacity-80 border-t border-base-300/30 bg-base-200/30">
                <div class="prose prose-sm max-w-none dark:prose-invert py-2 leading-relaxed italic">
                    {@html parseMarkdown(parsed.thinking)}
                </div>
            </div>
        </div>
    {/if}

    {#if parsed.response}
        <div class="prose prose-sm max-w-none dark:prose-invert wrap-break-word">
            {@html parseMarkdown(parsed.response)}
        </div>
    {:else if !parsed.thinking && !parsed.response && !parsed.pre}
        <!-- Empty state -->
    {/if}
</div>