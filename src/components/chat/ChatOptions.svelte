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
{chatParamsState.promptSystem?.code ?? $t('prompt.systemPrompt')}</button>
<div popover class="popover " id="popover" style="position-anchor : --anchor;"> 
    <div class="flex-col flex gap-1">
        {#each promptList as prompt}
        <button value={prompt.name} onclick={() => chatParamsState.promptSystem = prompt} >{prompt.name}</button>  
        {/each}
    </div>
</div>
<!-- <ButtonMenu
    tall="mini"
    width="auto"
    icon="material-symbols-light:post-add-sharp"
    value={chatParamsState.promptSystem?.code ?? $t('prompt.systemPrompt')}
    popperProps={{ stickToHookWidth: true, position: 'BL', flow: 'fixed', autoClose: true }}
    variant="naked"
    menuProps={{
        data: promptList,
        grid: 3,
        listItemBottom: listItemBottom,
        onclick: (event) => {
            chatParamsState.promptSystem = event;
        },
    }}>
    {#snippet menuItem({ item })}
        <MenuListItem data={item}>
            {item?.name}
        </MenuListItem>
    {/snippet}
</ButtonMenu> -->
<Attachment form="prompt-form" bind:imageFile={chatParamsState.images} disabled={false} />
<ButtonMenu popperProps={{ stickToHookWidth: true, position: 'TC', flow: 'fixed' }} tall="tiny" width="auto" variant="naked">
    <div class="flex-h flex-align-middle gap-2">
        <Icon icon="mdi:temperature" />
        {chatParamsState?.temperature}
        <Icon icon="bx:brain" />
    <Model bind:activeModels={chatParamsState.models} />
        <!-- {chatParamsState?.models}
        <Icon icon="charm:binary" />
        {chatParamsState?.format} -->
        
    </div>
    {#snippet menuItem({ item })}
        <!-- <table cellpadding="4">
            <tbody>
                <tr>
                    <td>model</td>
                    <td><Model bind:activeModels={chatParams.models} /></td>
                </tr>
                <tr>
                    <td>temperature</td>
                    <td
                        >{#each Object.keys($settings.temperatures ?? {}) as temperature}
                            {@const active = chatParams?.temperature == $settings.temperatures[temperature]}
                            <button
                                onclick={() => {
                                    setTemperature($settings.temperatures[temperature]);
                                }}
                                class:active
                                class="button-temp">{temperature}</button>
                        {/each}</td>
                </tr>
                <tr>
                    <td>mode</td>
                    <td
                        ><div class="line-gap-2 flex-1">
                            <Icon icon="charm:binary" class="sm" />
                            <Selector values={['json', 'plain']} value={chatParams.format} let:item>
                                <button onclick={() => setRequestMode(item)}>{item}</button>
                            </Selector>
                        </div></td>
                </tr>
            </tbody>
        </table> -->
    {/snippet}
</ButtonMenu>

<style lang="postcss">  
    
    .button-temp {
        @apply rounded-md;
        @apply p-1 px-2;
        @apply opacity-50;
        &.active {
            @apply opacity-100 bg-gradient-to-tl from-gray-600 to-gray-800 shadow shadow-gray-950;
            @apply text-white;
        }
    } 
    :popover-open {
	width: 200px; 
	position: absolute;
	inset: unset; 
	margin: 0; 
}
.anchor {
	anchor-name: --myAnchor;
	display: inline-flex;  
}

.popover {
	position-anchor: --myAnchor;
	position: fixed;
	left: anchor(left);
	bottom: anchor(top);  
	padding: 10px;
	z-index:9000;
	width: auto;
	text-align:left;
}
</style>
