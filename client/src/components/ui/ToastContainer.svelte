<script lang="ts">
    import { toast } from '$lib/state/notifications.svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    // Mapping position to DaisyUI classes
    const positionClasses = $derived({
        'top-left': 'toast-top toast-start',
        'top-right': 'toast-top toast-end',
        'top-center': 'toast-top toast-center',
        'bottom-left': 'toast-bottom toast-start',
        'bottom-right': 'toast-bottom toast-end',
        'bottom-center': 'toast-bottom toast-center'
    }[toast.position]);

    // Mapping type to DaisyUI alert classes
    function getTypeClass(type: string) {
        switch (type) {
            case 'success': return 'alert-success';
            case 'error': return 'alert-error';
            case 'warning': return 'alert-warning';
            case 'info': return 'alert-info';
            default: return 'alert-info';
        }
    }

    function getIcon(type: string) {
        switch (type) {
            case 'success': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'error': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
            case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
            default: return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
        }
    }
</script>

<div class="toast {positionClasses} z-50 p-4">
    {#each toast.toasts as item (item.id)}
        <div 
            animate:flip={{ duration: 300 }}
            in:fly={{ y: 20, duration: 300 }} 
            out:fade={{ duration: 200 }}
            class="alert {getTypeClass(item.type)} shadow-lg min-w-[300px] flex justify-between cursor-pointer"
            onclick={() => toast.remove(item.id)}
            role="alert"
            onkeydown={(e) => e.key === 'Enter' && toast.remove(item.id)}
            tabindex="0"
        >
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={getIcon(item.type)} /></svg>
                <span>{item.message}</span>
            </div>
            {#if !item.timeout}
                <button class="btn btn-xs btn-ghost btn-circle" aria-label="Close">✕</button>
            {/if}
        </div>
    {/each}
</div>
