<script lang="ts">
	import Models from '$components/settings/mdl/Models.svelte';
	import Infos from './mdl/Infos.svelte';
	import Icon from '@iconify/svelte';
	import { t } from '$lib/stores/i18n.js';
	import General from './mdl/General.svelte';
	import Advanced from './mdl/Advanced.svelte';
	import Addons from './mdl/Addons.svelte';
	import Cartouche from '../fragments/Cartouche.svelte';
	import { ui } from '$lib/stores/ui';
	import { engine } from '$lib/tools/engine';

	let settingList = {
		general: General,
		advanced: Advanced,
		addons: Addons,
		infos: Infos
	};
</script>

<div class="flex-align-middle justify-between px-5 py-4 gap-4">
	<div class=" "><Icon icon="mdi:settings" class="lg" /></div>
	<div class="flex-1 text-3xl font-medium self-center capitalize">{$t('ui.settings')}</div>
	<div>
		<a
			class="underline"
			on:click={() => {
				engine.goto('configuration');
				ui.showHideSettings()
			}}>advanced configuration</a
		>
	</div>
	<button on:click={() => ui.showHideSettings()} type="button" aria-label="close">
		<Icon icon="mdi:close" style="font-size:1.6em" />
	</button>
</div>
<div class="flex w-full settings p-4 px-8">
	<div class=" w-full">
		{#each Object.keys(settingList) as setting}
			<Cartouche title={$t(`settings.modules.${setting}`)}>
				<svelte:component this={settingList[setting]} />
			</Cartouche>
		{/each}
	</div>
</div>

<style lang="postcss">
	.settings {
		height: 750px;
		overflow: auto;
	}
</style>
