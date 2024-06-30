<script lang="ts">
	import MainChat from '$components/chat/MainChat.svelte';
	
    import { page } from '$app/stores';
	$inspect($page.params.id);
</script>

{#key $page.params.id}
	<MainChat activeChatId={$page.params.id} />
{/key}
