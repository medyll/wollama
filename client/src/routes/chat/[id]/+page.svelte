<script lang="ts">
    import { page } from '$app/stores';
    import ChatWindow from '$components/chat/ChatWindow.svelte';
</script>

<!-- Section: Chat Detail Wrapper -->
<ChatWindow chatId={$page.params.id} />
