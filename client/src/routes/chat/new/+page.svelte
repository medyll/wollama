<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { chatService } from '$lib/services/chat.service';

    onMount(async () => {
        const companionId = $page.url.searchParams.get('companion_id') || undefined;
        try {
            const chatId = await chatService.createChat(undefined, undefined, companionId);
            goto(`/chat/${chatId}`, { replaceState: true });
        } catch (e) {
            console.error('Failed to create chat:', e);
            // Fallback to home if creation fails
            goto('/chat');
        }
    });
</script>

<div class="flex items-center justify-center h-full">
    <span class="loading loading-spinner loading-lg"></span>
</div>
