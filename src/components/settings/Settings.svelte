<script lang="ts">
    import Models from '$components/settings/mdl/Models.svelte';
    import Infos from './mdl/Infos.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/stores/i18n.js';
    import General from './mdl/General.svelte';
    import Addons from './mdl/Addons.svelte';
    import { Cartouche } from '@medyll/slot-ui';
    import Options from './mdl/Options.svelte';

    let settingList = {
        general: General,
        addons: Addons,
		models: Models,
		options: Options,
        infos: Infos,
    };
</script>

<div class="flex-align-middle justify-between px-5 py-4 gap-4">
    <div class=" "><Icon icon="mdi:settings" class="md" /></div>
    <div class="flex-1 text-2xl font-medium self-center capitalize">{$t('ui.settings')}</div> 
    <!-- <button on:click={() => ui.showHideSettings()} type="button" aria-label="close">
        <Icon icon="mdi:close" style="font-size:1.6em" />
    </button> -->
</div>
<div class="flex w-full settings p-4 px-8">
    <div class="flex flex-col gap-4 w-348">
        {#each Object.keys(settingList) as setting}
            <Cartouche   primary={$t(`settings.modules.${setting}`)}> 
				<Icon slot="cartoucheIcon"  icon="mdi:wrench"   />
                <div class="p-4"><svelte:component this={settingList[setting]} /></div>
            </Cartouche>
        {/each}
    </div>
</div>

<style lang="postcss">

    .settings {
        height: auto;
        overflow: auto;
    }
</style>
