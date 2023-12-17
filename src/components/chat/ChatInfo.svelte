<script lang="ts">
	import { dbQuery } from '$lib/db/dbQuery'; 
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import { format } from 'date-fns';
	import { liveQuery } from 'dexie'; 
 
	$: formattedDate = $activeChat?.dateCreation ? format(new Date($activeChat?.dateCreation), 'EEEE, dd MMMM') : '';

	$: activeChat = liveQuery(()=> $ui.activeChatId ? dbQuery.getChat($ui.activeChatId) : null) ;
 
</script>

{#if $activeChat?.dateCreation}
	<div class="p-1">
		<div class="text-lg">
			{$activeChat?.title ?? ''}
		</div>
		<div class="flex-align-middle">
		<div class="opacity-40 flex-1">
			{$t('ui.startondate')} {formattedDate}
		</div>
		<slot />
		</div>
	</div>
{/if}