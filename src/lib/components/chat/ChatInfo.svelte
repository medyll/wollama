<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { format } from 'date-fns';

	$: chat = chatter.getChat($activeChatId);
	$: formattedDate = chat?.dateCreation ? format(new Date(chat.dateCreation), 'EEEE, dd MMMM') : '';
</script>

{#if chat?.dateCreation}
	<div>
		<div>
			{formattedDate}
		</div>
		<div>
			{chat?.title ?? ''}
		</div>
	</div>
{/if}