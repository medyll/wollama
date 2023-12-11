<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { activeChatId } from '$lib/stores/chatter';
	import { showSettings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
</script>

<div class="flex justify-middle p-2 gap-8">
	<div class="flex-1">AIUI</div>
	<button
		on:click={() => {
			goto('/signing');
		}}
		title={$t('ui.userProfile')}
	>
		<Icon icon="mdi:account-circle-outline" style="font-size:1.6em" />
	</button>
	<button title={$t('ui.settings')} class="borderButton" on:click={() => showSettings.set(true)}>
		<Icon icon="mdi:cog-outline" style="font-size:1.6em" />
	</button>
</div>
