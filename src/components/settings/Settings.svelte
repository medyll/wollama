<script lang="ts">
	import Models from '$components/settings/mdl/Models.svelte';
	import Infos from './mdl/Infos.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import { t } from '$lib/stores/i18n.js';
	import General from './mdl/General.svelte';
	import Addons from './mdl/Addons.svelte';
	import { Cartouche, Looper } from '@medyll/idae-slotui-svelte';
	import Options from './mdl/Options.svelte';
	import PageTitle from '$components/ui/PageTitle.svelte';

	/* let settingGen = {
        general: General,
        addons: Addons,
    };
    let settingList = {
        models: Models,
        options: Options,
    };
    let settingMore = $state({
        infos: Infos,
    }); */
</script>

<PageTitle icon="mdi:settings" title="ui.settings" />
<div class="settings flex w-full p-4 px-8">
	<div class="flex w-348 flex-col gap-4">
		<div class="soft-title">{$t(`settings.general`)}</div>
		<Cartouche
			class="pad"
			tall="kind"
			isOpen={false}
			icon={{ icon: 'mdi:wrench' }}
			primary={'general'}
		>
			<General />
		</Cartouche>
		<Cartouche tall="kind" isOpen={false} icon={{ icon: 'mdi:wrench' }} primary={'addons'}>
			<Addons />
		</Cartouche>
		<div class="soft-title">{$t(`settings.ollama`)}</div>
		<Cartouche tall="kind" isOpen={false} icon={{ icon: 'mdi:wrench' }} primary={'models'}>
			<Models />
		</Cartouche>
		<Cartouche tall="kind" isOpen={false} icon={{ icon: 'mdi:wrench' }} primary={'options'}>
			<Options />
		</Cartouche>
		<div class="soft-title">{$t(`settings.more`)}</div>
		<Cartouche tall="kind" isOpen={false} icon="mdi:wrench" primary={$t(`settings.modules.more`)}>
			<Infos />
		</Cartouche>
	</div>
</div>

<style lang="postcss">
	@reference "../../styles/references.css";
	.settings {
		height: auto;
		overflow: auto;
	}
</style>
