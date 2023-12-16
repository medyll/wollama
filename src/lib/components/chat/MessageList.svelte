<script lang="ts">
	import { liveQuery } from 'dexie';
	import Message from '$lib/components/chat/Message.svelte'; 
	import Bottomer from '../ui/Bottomer.svelte'; 
	import { dbQuery } from '$lib/db/dbQuery';

	export let chatId: string;
 

	let messages = liveQuery(()=> dbQuery.getMessages(chatId));

</script>

<div class="flex-v w-full h-full overflow-hidden">
	{#each ($messages ?? []) as message}
		<Message {message} />
	{/each}
	<Bottomer />
</div>
