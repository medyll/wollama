<script lang="ts">
	import { t } from '$lib/i18n';
	import Icon from '@iconify/svelte';
	import InfoLine from '../ui/InfoLine.svelte';
</script>

<InfoLine title={$t('settings.theme')}>Theme</InfoLine>
<hr />
<InfoLine title={'Ollama ' + $t('settings.server_url')} vertical>
	<div class="flex">
		<input class="flex-1" type="text" value={'http'} />
		<button title={$t('settings.test_connection')}><Icon icon="mdi:reload" /> </button>
	</div>
</InfoLine>
<hr />
<InfoLine title={$t('settings.system_prompt')} vertical>
	<textarea class="w-full">prompt</textarea>
</InfoLine>
