<script lang="ts">
	import Models from './mdl/Models.svelte';
	import Infos from './mdl/Infos.svelte';
	import { showSettings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import { t } from '$lib/i18n.js';
	import General from './mdl/General.svelte';
	import Advanced from './mdl/Advanced.svelte';
	import Addons from './mdl/Addons.svelte';
	import Cartouche from '../ui/Cartouche.svelte';

	let settingList = {
		general: General,
		advanced: Advanced,
		models: Models,
		addons: Addons,
		infos: Infos
	};
	let activeSetting = 'general';
</script>

<div class="flex-align-middle justify-between  px-5 py-4 gap-4">
	<div class=" "><Icon icon="mdi:settings" style="font-size:1.8em" /> </div>
	<div class="flex-1 text-3xl font-medium self-center capitalize">{$t('ui.settings')}</div>
	<button on:click={() => showSettings.set(false)}>
		<Icon icon="mdi:close" style="font-size:1.6em" />
	</button>
</div> 
<div class="flex w-full settings p-2">
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
		overflow:auto;
	}
</style>
