<script lang="ts">
	import { liveQuery } from 'dexie';
	import Message from '$lib/components/chat/Message.svelte';
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { onMount } from 'svelte';
	import Bottomer from '../ui/Bottomer.svelte';
	import { dbase } from '$lib/db/db';
	import { dbQuery } from '$lib/db/chatDb';

	export let chatId: string;
 

	let messages = liveQuery(()=> dbQuery.getMessages(chatId));

</script>

<div class="flex-v w-full h-full overflow-hidden">
	{#each ($messages ?? []) as message}
		<Message {message} />
	{/each}
	<Bottomer />
</div>
