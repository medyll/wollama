<script lang="ts">
	import MainChat from '$components/chat/Chat.svelte';

	import { page } from '$app/state';
</script>

{#key page.params.id}
	<MainChat activeChatId={page.params.id} chatPassKey={page.params.id} />
{/key}
