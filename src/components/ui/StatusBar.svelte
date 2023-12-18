<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { connectionChecker } from '$lib/stores/connection';
	import { pullModelState } from '$lib/stores';

	let printCountDown: boolean;

	connectionChecker.subscribe((n) => {
		printCountDown = ['error'].includes(n.connectionStatus) ? true : false;
	});

	pullModelState.subscribe((n) => {
		if (n?.status == 'error') {
			printCountDown = true;
		}
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
