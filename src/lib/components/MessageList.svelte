<script lang="ts"> 
	import Message from '$lib/components/Message.svelte'; 
	import { chatList } from '$lib/stores/chatList';

	export let chatId: string; 

	$: messages = $chatList?.[chatId]?.messages ?? {}
</script>

<div class="flex-v w-full h-full overflow-x-auto">
	{#each Object.values(messages) as message}
	<div class="flex justify-between rounded-lg group">	
		<Message {message} />
	</div>
	{/each}
</div>
