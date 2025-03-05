<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { connectionChecker } from '$lib/stores/connection';
	import { pullModelState } from '$lib/stores';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import { connectionTimer } from '$lib/stores/timer.svelte';

	let printCountDown: boolean;
	let { status, error, digest, total, completed } = $pullModelState;
	let pullStatus: string | undefined = status ?? error;

	let progress: number = total && completed ? completed - total : 0;

	let icon = $derived(connectionTimer.connected ? 'uil:wifi' : 'uil:wifi-slash');
	let color = $derived(connectionTimer.connected ? 'green' : 'red');
</script>

<div class="line-gap-2">
	<div>{pullStatus ? pullStatus : ''}</div>
	<div>
		<progress hidden={progress === 0} class="w-full" value={completed ?? 0} max={total ?? 0}
		></progress>
	</div>
	<!-- <div>{connectionTimer.getState.retryCount}</div> -->
	<!-- <div>
		{$t(`status.${$connectionChecker.connectionStatus}`)}
	</div> -->
	<div><Icon {icon} class="md" {color} /></div>
	<div>
		{#if !connectionTimer.connected}
			{$t('ui.retryInSeconds', { seconds: connectionTimer.getState.retryCount })}
		{/if}
	</div>
</div>
