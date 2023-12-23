<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { ollamaOptionsRanges } from '$configuration/configuration';
	import Selector from '$components/fragments/Selector.svelte';
	import List from '$components/fragments/List.svelte';

	function setRequestMode() {
		$settings.request_mode = $settings.request_mode == 'json' ? 'plain' : 'json';
	}
</script>

<InfoLine title={$t('settings.request_mode')}>
	<Selector values={['json', 'plain']} value={$settings.request_mode} let:item>
		<button on:click={() => settings.setSetting('request_mode', item)}>{item}</button>
	</Selector>
</InfoLine>
<hr />
<List data={Object.keys($settings.ollamaOptions)} let:item={setting}>
	<InfoLine title={$t(`settings.${setting}`)}>
		{#if Array.isArray(ollamaOptionsRanges[setting])}
			<input
				type="range"
				min={ollamaOptionsRanges[setting][0]}
				max={ollamaOptionsRanges[setting][1]}
				step={ollamaOptionsRanges[setting][2]}
				bind:value={$settings.ollamaOptions[setting]}
			/>
		{:else}
			<input type="text" bind:value={$settings.ollamaOptions[setting]} />
		{/if}
		<div slot="titleButton">{$settings.ollamaOptions[setting]}</div>
	</InfoLine>
</List>
