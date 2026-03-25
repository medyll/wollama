<script lang="ts">
	import { page } from '$app/stores';
	import ChatWindow from '$components/chat/ChatWindow.svelte';
	import { uiState } from '$lib/state/ui.svelte';

	let chatId = $derived($page.params.id === 'new' ? undefined : $page.params.id);
	let companionId = $derived(uiState.activeCompanionId);
</script>

<!-- Section: Chat Detail Wrapper -->
<ChatWindow {chatId} initialCompanionId={companionId} />
