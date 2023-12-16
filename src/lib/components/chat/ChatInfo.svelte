<script lang="ts">
	import { activeChat } from '$lib/stores/chatter';
	import { format } from 'date-fns';
 
	$: formattedDate = $activeChat?.dateCreation ? format(new Date($activeChat?.dateCreation), 'EEEE, dd MMMM') : '';
</script>

{#if $activeChat?.dateCreation}
	<div>
		<div>
			{formattedDate}
		</div>
		<div>
			{$activeChat?.title ?? ''}
		</div>
	</div>
{/if}