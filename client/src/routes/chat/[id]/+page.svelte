<script lang="ts">
    import { page } from '$app/stores';
    import ChatWindow from '$components/chat/ChatWindow.svelte';
</script>

<ChatWindow chatId={$page.params.id} />
