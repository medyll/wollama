<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { settings } from '$lib/stores/settings.js';
	import {translations} from '../../../locales/translations';
	import Selector from '$components/fragments/Selector.svelte';
	import { engine } from '$lib/tools/engine';

	import {Switch} from "@medyll/slot-ui"
	settings.subscribe((o) => {
		// if($settings.theme != o.theme)
		engine.applyTheme(o.theme);
	});

</script>

<InfoLine title={$t('settings.lang')}>
	<div class="flex-align-middle gap-4">
		<Selector values={Object.keys(translations)} value={$settings.locale} let:item let:active>
			<button on:click={() => settings.setSetting('locale', item)}>{item}</button>
		</Selector>
	</div>
</InfoLine>
<hr />
<InfoLine title={$t('settings.theme')}>
	<div class="flex-align-middle gap-4">
		<Selector values={['light', 'dark']} value={$settings.theme} let:item let:active>
			<button on:click={() => settings.setSetting('theme', item)}>
				<Icon icon="system-uicons:{item == 'light' ? 'sun' : 'moon'}" />
				{item}</button
			>
		</Selector>
	</div>
</InfoLine>
<hr />
<InfoLine title={$t('settings.auth')}>
	<Switch onChange={()=>{
		settings.setSetting('authHeader', !$settings.authHeader)
	}} checked={$settings.authHeader}  />  
</InfoLine>
