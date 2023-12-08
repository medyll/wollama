<script lang="ts"> 
	import Message from '$lib/components/chat/Message.svelte'; 
	import { chatter } from '$lib/stores/chatter';

	export let chatId: string; 

	$: messages = $chatter?.[chatId]?.messages ?? {}
</script>

<div class="flex-v w-full h-full overflow-x-auto">
	{#each Object.values(messages) as message}
	<div class="flex justify-between rounded-lg group">	
		<Message {message} />
	</div>
	{/each}
</div>
