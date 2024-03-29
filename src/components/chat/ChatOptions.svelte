<script lang="ts">
    import {  ollamaPayloadStore } from '$lib/stores/prompter';
    import { settings } from '$lib/stores/settings.svelte';
    import Icon from '@iconify/svelte';
    import Selector from '$components/fragments/Selector.svelte';
    import Prompts from '$components/settings/prompts/Prompts.svelte';
    import { t } from '$lib/stores/i18n';
    import { ui } from '$lib/stores/ui';
    import { chatParams } from '$lib/states/chat.svelte';

    $: component = $ui.showPrompt ? Prompts : undefined;

    function setTemperature(temperature: number) {
        chatParams.temperature = temperature;
    }

    function setRequestMode(format: 'json' | 'plain' ) {
        chatParams.format = format;
    }
</script>

<div class="p-1 flex-align-middle theme-bg rounded-md pb-2">
    <svelte:component this={component} bind:activePrompt={chatParams.promptSystem} />
    <div class="flex-1 text-center relative">
        <button on:click={() => ui.showHidePromptMenu()}>
            {chatParams.promptSystem.title ?? $t('prompt.systemPrompt')}
        </button>
    </div>
    <div class="flex justify-center gauge relative">
        <div class="absolute -left-10"><Icon icon="mdi:temperature" class="md" /></div>
        {#each Object.keys($settings.temperatures ?? {}) as temperature}
            {@const active = chatParams?.temperature == $settings.temperatures[temperature]}
            <button
                on:click={() => {
                    setTemperature($settings.temperatures[temperature]);
                }}
                class:active
                class="button-temp">{temperature}</button
            >
        {/each}
    </div>
    <div class="line-gap-2 flex-1 justify-center"> 
        <Icon icon="charm:binary" class="sm" />
        <Selector values={['json', 'plain']} value={chatParams.format} let:item>
            <button on:click={() => setRequestMode(item)}>{item}</button>
        </Selector>
    </div>
</div>

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
