<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { OllamaOptionsDefaults, ollamaOptionsRanges } from '$configuration/configuration';
	import Selector from '$components/fragments/Selector.svelte';
	import List from '$components/fragments/List.svelte';
	import Icon from '@iconify/svelte';
	import translations from '../../../locales/translations';

	let ollama_server = $settings.ollama_server;

	function setRequestMode() {
		$settings.request_mode = $settings.request_mode == 'json' ? 'plain' : 'json';
	}
</script>

<InfoLine title={'Ollama ' + $t('settings.server_url')} vertical>
	<form
		on:submit|preventDefault={(e) => {
			settings.setSetting('ollama_server', ollama_server);
		}}
		class="flex"
	>
		<input bind:value={ollama_server} class="flex-1" type="text" />
		<button
			on:click={() => {
				settings.setSetting('ollama_server', ollama_server);
			}}
			title={$t('settings.test_connection')}
			class="aspect-square"
			><Icon class="md" icon="iconoir:server-connection" />
		</button>
	</form>
</InfoLine>
<hr />
<InfoLine title={$t('settings.lang')}>
	<div class="flex-align-middle gap-4">
		<Selector values={Object.keys(translations)} value={$settings.locale} let:item let:active>
			<button on:click={() => settings.setSetting('locale', item)}>{item}</button>
		</Selector>
	</div>
</InfoLine>
<hr />
<div class="soft-title p-2">Options</div>
<List data={Object.keys(OllamaOptionsDefaults)} let:item={setting}>
	<div class="flex-align-middle gap-2">
		<div class="flex-1">{setting}</div>
		<div>
			{#if Array.isArray(ollamaOptionsRanges[setting])}
				<input
					type="range"
					min={ollamaOptionsRanges[setting][0]}
					max={ollamaOptionsRanges[setting][1]}
					step={ollamaOptionsRanges[setting][2]}
					bind:value={$settings.ollamaOptions[setting]}
				/>
			{:else}
				<input class="inputTiny" type="text" bind:value={$settings.ollamaOptions[setting]} />
			{/if}
		</div>
		<div class="w-16 text-center">{$settings.ollamaOptions[setting] ?? ''}</div>
		<div class="w-16"><button>reset</button></div>
	</div>
	<hr />
</List>

<style>
	.inputTiny {
		width: 3rem;
	}
</style>
