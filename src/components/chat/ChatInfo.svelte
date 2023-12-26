<script lang="ts">
	import { idbQuery } from '$lib/db/dbQuery';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';
	import { format } from 'date-fns';
	import { liveQuery } from 'dexie';

	$: formattedDate = $activeChat?.dateCreation
		? format(new Date($activeChat?.dateCreation), 'EEEE, dd MMMM')
		: '';

	$: activeChat = liveQuery(() => ($ui.activeChatId ? idbQuery.getChat($ui.activeChatId) : null));
</script>

{#if $activeChat?.dateCreation}
	<div class="p-1 py-4"> 
		<div class="flex-align-middle">
			<div class="opacity-40 flex-1 px-2">
				{$t('ui.startondate')}:
				{formattedDate}
			</div>
			<slot />
		</div>
	</div>
{/if}