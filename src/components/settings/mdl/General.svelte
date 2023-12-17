<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/ui/InfoLine.svelte';
	import { settings } from '$lib/stores/settings.js';
	import { engine } from '$lib/tools/engine';

	let ollama_server = $settings.ollama_server;

	function changeThemeHandler() {
		engine.setTheme($settings.theme == 'light' ? 'dark' : 'light')
	}

	function settingsUrl(url: string) {
		$settings.ollama_server = url;
	}

	function settingAuth() {
		$settings.authHeader = $settings.authHeader == true ? false : true;
	} 
</script>

<InfoLine title={$t('settings.theme')}>
	<button on:click={() => changeThemeHandler()}>
		{$settings.theme}
		<Icon icon="mdi:theme-light-dark" />
	</button>
</InfoLine>
<hr />
<InfoLine title={'Ollama ' + $t('settings.server_url')} vertical>
	<form on:submit|preventDefault={(e)=>{$settings.ollama_server= ollama_server}} class="flex">
		<input bind:value={ollama_server} class="flex-1" type="text"  />
		<button on:click={()=> settingsUrl(ollama_server)} title={$t('settings.test_connection')}><Icon icon="mdi:upload" /> </button>
	</form>
</InfoLine>
<hr />
<InfoLine title={$t('settings.auth')}>
	<button on:click={settingAuth}>
		{$settings.authHeader}
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.system_prompt')} vertical>
	<textarea cols="4" class="w-full">{$settings.system_prompt}</textarea>
</InfoLine>
