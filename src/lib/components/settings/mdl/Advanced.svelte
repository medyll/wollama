<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings';
	import InfoLine from '$lib/components/ui/InfoLine.svelte';
</script>

<InfoLine title={$t('settings.request_mode')}>json / plain</InfoLine>
<hr />

{#each Object.keys($settings.llamaOptions) as setting}
	{@const settingValue = $settings.llamaOptions[setting]}
	<InfoLine title={$t('settings.' + setting)}>
		{#if setting == 'temperature'}
			<input type="range"  min="0" max="1" step="0.1"  value={settingValue} />
		{:else if setting == ''}{:else}
			<input type="text" value={settingValue} />
		{/if}
	</InfoLine>
{/each}
