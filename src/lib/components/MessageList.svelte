<script lang="ts">
	import { messageList } from '../stores/messages';
	import Message from '$lib/components/Message.svelte';

	console.log($messageList)
</script>

<div class="flex-v w-full h-full overflow-x-auto">
	{#each Object.values($messageList) as message}
	<div class="flex justify-between rounded-lg group">	
		<Message {message} />
	</div>
	{/each}
</div>
