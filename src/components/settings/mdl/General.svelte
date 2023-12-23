<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { settings } from '$lib/stores/settings.js';
	import { engine } from '$lib/tools/engine';
	import translations from '../../../locales/translations';

	let ollama_server = $settings.ollama_server;

	function changeThemeHandler() {
		engine.applyTheme($settings.theme == 'light' ? 'dark' : 'light');
	}
</script>

<InfoLine title={$t('settings.theme')}>
	<button class="borderButton  flex-align-middle gap-2" on:click={() => changeThemeHandler()}>
		{$settings.theme}
		<Icon icon="mdi:theme-light-dark" />
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.lang')}>
	<div class="flex-align-middle gap-2">
		{#each Object.keys(translations) as lang}
			<button
				class="borderButton aspect-square"
				on:click={() => {
					$settings.locale = lang;
				}}
			>
				{lang}
			</button>
		{/each}
	</div>
</InfoLine>
<hr />
<InfoLine title={'Ollama ' + $t('settings.server_url')} vertical>
	<form
		on:submit|preventDefault={(e) => {
			$settings.ollama_server = ollama_server;
		}}
		class="flex"
	>
		<input bind:value={ollama_server} class="flex-1" type="text" />
		<button
			on:click={() => {
				$settings.ollama_server = ollama_server;
			}}
			title={$t('settings.test_connection')}
			><Icon icon="mdi:upload" />
		</button>
	</form>
</InfoLine>
<hr />
<InfoLine title={$t('settings.auth')}>
	<button on:click={() => ($settings.authHeader = !$settings.authHeader)}>
		{$settings.authHeader}
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.system_prompt')} vertical>
	<textarea cols="4" class="w-full">{$settings.system_prompt}</textarea>
</InfoLine>
