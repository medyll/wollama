<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import InfoLine from '$components/ui/InfoLine.svelte';

	function setRequestMode() {
		$settings.request_mode = $settings.request_mode =='json' ? 'plain' : 'json';
	}
</script>

<InfoLine title={$t('settings.request_mode')}>
<button on:click={() => setRequestMode()}>{$settings.request_mode}</button>
</InfoLine>
<hr />

{#each Object.keys($settings.llamaOptions) as setting}
	{@const settingValue = $settings.llamaOptions[setting]}
	<InfoLine title={$t(`settings.${setting}`)}>
		{#if setting == 'temperature'}
			<input type="range" min="0" max="1" step="0.1" bind:value={$settings.llamaOptions[setting]} />
		{:else if setting == ''}{:else}
			<input type="text" bind:value={$settings.llamaOptions[setting]} />
		{/if}
	</InfoLine>
{/each}