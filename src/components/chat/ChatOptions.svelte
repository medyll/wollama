<script lang="ts">
    import { settings } from '$lib/stores/settings.svelte';
    import Icon from '@iconify/svelte';
    import Selector from '$components/fragments/Selector.svelte';
    import Prompts from '$components/settings/prompts/Prompts.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import { chatParams } from '$lib/states/chat.svelte';
    import Model from './input/Model.svelte';
    import { Button, ButtonMenu, MenuListItem, Popper } from '@medyll/slot-ui';
    import Attachment from './input/Attachment.svelte';
    import { idbQuery } from '$lib/db/dbQuery';

    let component = $ui.showPrompt ? Prompts : undefined;

    let promptList = $derived(idbQuery.getPrompts());

    function setTemperature(temperature: number) {
        chatParams.temperature = temperature;
    }

    function setRequestMode(format: 'json' | 'plain') {
        chatParams.format = format;
    }

    let showHide = $state(false);
    let style = $derived( showHide ? 'display: contents;':'display: none;content-visibility:hidden');
</script>

{#snippet listItemBottom()}
    <MenuListItem
        icon={'mdi:chevron-right'}
        onclick={() => {
            showHide = !showHide
        }}></MenuListItem>
{/snippet}
{#snippet popperRight()}
    <div {style} >
        <Prompts bind:activePrompt={chatParams.promptSystem} />
    </div>
{/snippet}
<ButtonMenu
    tall="small"
    width="auto"
    icon="material-symbols-light:post-add-sharp"
    value={chatParams.promptSystem?.title ?? $t('prompt.systemPrompt')}
    popperProps={{ stickToHookWidth: true, position: 'TR', flow: 'fixed', popperRight }}
    menuProps={{
        data: promptList,
        listItemBottom,
        onclick: (event) => {
            chatParams.promptSystem = event.detail;
        },
    }}>
    {#snippet menuItem({ item })}
        <MenuListItem data={item}
            >{item?.title}

        </MenuListItem>
    {/snippet}
</ButtonMenu>
<Attachment form="prompt-form" bind:imageFile={chatParams.images} disabled={false} />
<ButtonMenu popperProps={{ stickToHookWidth: true, position: 'TC', flow: 'fixed' }} tall="tiny" width="auto" variant="naked">
    <div class="flex-h flex-align-middle gap-2">
        <Icon icon="mdi:temperature" />
        {chatParams?.temperature}
        <Icon icon="bx:brain" />
        {chatParams?.models}
        <Icon icon="charm:binary" />
        {chatParams?.format}
    </div>
    {#snippet menuItem({ item })}
        <table cellpadding="4">
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
        </table>
    {/snippet}
</ButtonMenu>

<style lang="postcss">
    .gauge {
        @apply p-1  shadow shadow-gray-400 dark:shadow-black/80 rounded-md dark:bg-white/5;
    }
    .button-temp {
        @apply rounded-md;
        @apply p-1 px-2;
        @apply opacity-50;
        &.active {
            @apply opacity-100 bg-gradient-to-tl from-gray-600 to-gray-800 shadow shadow-gray-950;
            @apply text-white;
        }
    }
</style>
