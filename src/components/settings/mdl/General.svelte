<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { settings } from '$lib/stores/settings.js';
	import translations from '../../../locales/translations';
	import Selector from '$components/fragments/Selector.svelte';
	import { engine } from '$lib/tools/engine'; 

	let ollama_server = $settings.ollama_server; 

	settings.subscribe((o) => {
		if($settings.theme != o.theme) engine.applyTheme(o.theme)
	});
</script>

<InfoLine title={$t('settings.theme')}>
	<div class="flex-align-middle gap-4">
		<Selector values={['light','dark']} value={$settings.theme} let:item let:active>
			<button on:click={() => settings.setSetting('theme', item)}>
			<Icon icon="mdi:theme" />
			{item}</button>
		</Selector>
	</div>
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
<InfoLine title={$t('settings.auth')}>
	<button on:click={() => settings.setSetting('authHeader', !$settings.authHeader)}>
		{$settings.authHeader}
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.system_prompt')} vertical>
	<textarea cols="4" class="w-full h-24">{$settings.system_prompt}</textarea>
</InfoLine>
