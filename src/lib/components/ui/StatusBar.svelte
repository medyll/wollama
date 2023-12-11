<script lang="ts">
	import { t } from '$lib/i18n';
	import { connectionChecker } from '$lib/stores/connection';

	let printCountDown: boolean;

	connectionChecker.subscribe((n) => {
		printCountDown = ['error'].includes(n.connectionStatus) ? true : false;
	});
</script>

<div>
	{#if $connectionChecker.connectionStatus != 'connected'}
		{$connectionChecker.connectionStatus}
	{/if}
	{#if printCountDown}
		{$t('ui.retryInSeconds', { seconds: $connectionChecker.connectionRemainingSeconds })}
	{/if}
</div>
