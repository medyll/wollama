<script lang="ts">
	import { liveQuery } from 'dexie';
	import Message from '$lib/components/chat/Message.svelte'; 
	import Bottomer from '../ui/Bottomer.svelte'; 
	import { dbQuery } from '$lib/db/dbQuery';

	export let chatId: string | undefined;
 

	$: messages = liveQuery(()=> chatId ? dbQuery.getMessages(chatId) : []);

</script>

<div class="flex-v w-full gap-4">
	{#each ($messages ?? []) as message}
	    <slot {message}></slot>
	{/each}
	<Bottomer />
</div>
