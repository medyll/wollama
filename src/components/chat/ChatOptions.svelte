<script lang="ts">
    import { settings } from '$lib/stores/settings.svelte';
    import {Icon} from '@medyll/idae-slotui-svelte';
    import Selector from '$components/fragments/Selector.svelte';
    import Prompts from '$components/settings/prompts/Prompts.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import { chatParamsState } from '$lib/states/chat.svelte';
    import Model from './input/Model.svelte';
    import { Button, ButtonMenu, MenuListItem, Popper } from '@medyll/idae-slotui-svelte';
    import Attachment from './input/Attachment.svelte';
    import { idbQuery } from '$lib/db/dbQuery';
    import CrudCollectionList from '$components/form/CollectionListMenu.svelte';
    import CrudZone from '$components/form/CrudZone.svelte';

    let component = $ui.showPrompt ? Prompts : undefined;

    // let promptList = $derived(idbQuery.getPrompts());
    let promptList = idbQuery.getPrompts()

    function setTemperature(temperature: number) {
        chatParamsState.temperature = temperature;
    }

    function setRequestMode(format: 'json' | 'plain') {
        chatParamsState.format = format;
    }

    let showHide = $state(false);
    let style = $derived(showHide ? 'display: contents;' : 'display: none;content-visibility:hidden');
</script>

{#snippet listItemBottom({ item, itemIndex })}
    <MenuListItem icon="material-symbols-light:post-add-sharp" data={item}>
         {$t('prompt.createPrompt')}
    </MenuListItem>
{/snippet}
<datalist id="prompt-list">
    {#each promptList as prompt}
        <option value={prompt.name} />        
    {/each}
</datalist>
<button class="anchor flex gap-1" popovertarget="popover"  style="anchor-name: --anchor;" >
    <Icon icon="material-symbols-light:post-add-sharp" />
    {chatParamsState.promptSystem?.code ?? $t('prompt.systemPrompt')}
</button>
<div popover class="popover " id="popover" style="position-anchor : --anchor;"> 
    <div class="flex-col flex gap-1  ">
        {#each promptList as prompt}
        <button value={prompt.name} onclick={() => chatParamsState.promptSystem = prompt} >{prompt.name}</button>  
        {/each}
    </div>
</div> 
<Attachment form="prompt-form" bind:imageFile={chatParamsState.images} disabled={false} /> 
<div class="flex-h flex-align-middle gap-2">
    <Icon icon="mdi:temperature" />
    {chatParamsState?.temperature}
    <Icon icon="bx:brain" />
    <Model bind:activeModels={chatParamsState.models} />
    <!-- {chatParamsState?.models}
    <Icon icon="charm:binary" />
    {chatParamsState?.format} -->    
</div>  

<style lang="postcss">  
    @reference "../../styles/all.css";
    .button-temp {
        @apply rounded-md;
        @apply p-1 px-2;
        @apply opacity-50;
        &.active {
            @apply opacity-100 bg-linear-to-tl from-gray-600 to-gray-800 shadow shadow-gray-950;
            @apply text-white;
        }
    } 
</style>
