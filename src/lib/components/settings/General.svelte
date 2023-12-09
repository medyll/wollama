<script lang="ts">
	import { t } from '$lib/i18n';
	import Icon from '@iconify/svelte';
</script>

<div class="flex">
	<div class="flex-1">{$t('settings.theme')}</div>
	<div>Theme</div>
</div>
<hr />
<div>
	<div>Ollama {$t('settings.server_url')}</div>
	<div class="flex">
		<input class="flex-1" type="text" value={"http"} />
		<button title={$t('settings.test_connection')}><Icon icon="mdi:reload" /> </button>
	</div>
</div>
<hr />
<div>
	<div>{$t('settings.system_prompt')}</div>
    <div><textarea></textarea></div>
</div>
