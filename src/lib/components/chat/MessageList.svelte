<script lang="ts">
	import { liveQuery } from 'dexie';
	import Message from '$lib/components/chat/Message.svelte'; 
	import Bottomer from '../ui/Bottomer.svelte'; 
	import { dbQuery } from '$lib/db/dbQuery';

	export let chatId: string;
 

	$: messages = liveQuery(()=> chatId ? dbQuery.getMessages(chatId) : []);

</script>

<div class="flex-v w-full h-full overflow-hidden gap-4">
	{#each ($messages ?? []) as message}
		<hr class="w-16" />
		<Message {message} />
	{/each}
	<Bottomer />
</div>
