<script lang="ts">
    import Models from '$components/settings/mdl/Models.svelte';
    import Infos from './mdl/Infos.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/stores/i18n.js';
    import General from './mdl/General.svelte';
    import Addons from './mdl/Addons.svelte';
    import { Cartouche, Looper } from '@medyll/slot-ui';
    import Options from './mdl/Options.svelte';

    let settingGen = {
        general: General,
        addons: Addons,
    };
    let settingList = {
        models: Models,
        options: Options,
    };
    let settingMore = {
        infos: Infos,
    };
 
</script>

<div class="flex-align-middle justify-between px-5 py-4 gap-4">
    <div class=" "><Icon icon="mdi:settings" class="md" /></div>
    <div class="flex-1 text-2xl font-medium self-center capitalize">{$t('ui.settings')}</div>
</div>
<div class="flex w-full settings p-4 px-8">
    <div class="flex flex-col gap-4 w-348">
        <div class="soft-title">{$t(`settings.general`)}</div>
        <Looper data={Object.keys(settingGen)} let:item={setting} let:idx>
            <Cartouche  classes={{ content: 'px-4' }} iconProps={{ icon: 'mdi:wrench' }} primary={$t(`settings.modules.${setting}`)}>
                <svelte:component this={settingGen[setting]} />
            </Cartouche>
        </Looper>
        <div class="soft-title">{$t(`settings.ollama`)}</div>
        <Looper data={Object.keys(settingList)} let:item={setting} let:idx>
            <Cartouche  classes={{ content: 'px-4' }}  icon="mdi:wrench" primary={$t(`settings.modules.${setting}`)}>
              <svelte:component this={settingList[setting]} />
            </Cartouche>
        </Looper>
        <div class="soft-title">{$t(`settings.more`)}</div>
        <Looper data={Object.keys(settingMore)} let:item={setting} let:idx>
            <Cartouche  classes={{ content: 'px-4' }}  icon="mdi:wrench" primary={$t(`settings.modules.${setting}`)}>
                <svelte:component this={settingMore[setting]} />
            </Cartouche>
        </Looper>
    </div> 
</div>

<style lang="postcss">
    .settings {
        height: auto;
        overflow: auto;
    }
</style>
