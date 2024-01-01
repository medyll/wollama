<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { connectionChecker } from '$lib/stores/connection';
	import { pullModelState } from '$lib/stores';
	import Icon from '@iconify/svelte';

	let printCountDown: boolean;
	let { status, error, digest, total, completed } = $pullModelState;
	let pullStatus: string | undefined = status ?? error;

	let progress: number = total && completed ? completed - total : 0;

	$: icon = $connectionChecker.connectionStatus === 'connected' ? 'uil:wifi' : 'uil:wifi-slash';

	connectionChecker.subscribe((n) => {
		printCountDown = ['error'].includes(n.connectionStatus) ? true : false;
	});
</script>

<div class="flex-align-middle gap-2">
	<div>{pullStatus ? pullStatus : ''}</div>
	<div>
		<progress hidden={progress === 0} class="w-full" value={completed ?? 0} max={total ?? 0}></progress>
	</div>
	<div>
		{$t(`status.${$connectionChecker.connectionStatus}`)}
	</div>
	<div><Icon {icon} class="md" /></div>
	<div>
		{#if printCountDown}
			{$t('ui.retryInSeconds', { seconds: $connectionChecker.connectionRemainingSeconds })}
		{/if}
	</div>
</div>
