<script lang="ts">
	import Message from '$lib/components/chat/Message.svelte';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { onMount } from 'svelte';
	import Bottomer from '../ui/Bottomer.svelte';

	export let chatId: string; 

	$: messages = $chatter?.[chatId]?.messages ?? {}; 
	 
</script>

<div class="flex-v w-full h-full overflow-hidden border">
	{#each Object.values(messages) as message}
		<div class="flex justify-between rounded-lg group">
			<Message {message} />
		</div>
	{/each}
	<Bottomer />
</div>
