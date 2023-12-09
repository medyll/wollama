<script lang="ts">
	import Models from './Models.svelte';
	import Infos from './Infos.svelte';
	import { showSettings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import { t } from '$lib/i18n.js';
	import General from './General.svelte';
	import Advanced from './Advanced.svelte';
	import Addons from './Addons.svelte';
	import Auth from './Auth.svelte';

	let settingList = {
		general: General,
		advanced: Advanced,
		models: Models,
		addons: Addons,
		auth: Auth,
		infos: Infos
	};
	let activeSetting = 'general';
</script>

<div class=" flex justify-between dark:text-gray-300 px-5 py-4">
	<div class=" text-lg font-medium self-center">{$t('ui.settings')}</div>
	<button
		class="self-center"
		on:click={() => showSettings.set(false)}
	>
		<Icon icon="mdi:close" style="font-size:1.6em" />
	</button>
</div>
<hr class=" dark:border-gray-800" />
<div class="flex w-full">
	<div class="flex flex-col">
		{#each Object.keys(settingList) as setting}
			<button class="text-left" on:click={()=>{activeSetting = setting;}}>{setting}</button>
		{/each}
	</div>
	<div class="flex-1 px-4">
		<svelte:component this={settingList[activeSetting]} />
	</div>
</div>
