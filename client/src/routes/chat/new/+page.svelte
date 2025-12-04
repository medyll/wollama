<script lang="ts">
    import { page } from '$app/stores';
    import ChatWindow from '$components/chat/ChatWindow.svelte';

    let companionId = $derived($page.url.searchParams.get('companion_id') || undefined);
</script>

<!-- Section: New Chat Wrapper -->
<ChatWindow initialCompanionId={companionId} />
