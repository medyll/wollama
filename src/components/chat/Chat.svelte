<script lang="ts">

	import DashBoard from '$components/DashBoard.svelte'; 
	import MessagesList from './MessagesList.svelte'; 
	import ChatArea from './ChatArea.svelte';

	interface MainChatProps {
		chatPassKey?: string; 
	}

	let { chatPassKey }: MainChatProps = $props();

	let activeChatId: number | undefined = $state();

	function onChatLoaded(id: number, chatPassKey?: string) {
		activeChatId = id;
		window.history.replaceState(history.state, '', `/chat/${chatPassKey}`);
	}
 
</script>

{#snippet input()}
	<div class="application-chat-main">
		<ChatArea bind:activeChatId {chatPassKey} {onChatLoaded} />
	</div>
{/snippet}

<DashBoard showList={Boolean(activeChatId)}>
	{#snippet home()}
		{@render input()}
	{/snippet}
	<MessagesList id={activeChatId} />
	{@render input()}
</DashBoard>
