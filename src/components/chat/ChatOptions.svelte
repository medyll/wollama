<script lang="ts">
	import { prompter } from '$lib/stores/prompter';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import Selector from '$components/fragments/Selector.svelte';
	import Prompts from '$components/settings/Prompts.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';

	$: component = $ui.showPrompt ? Prompts : undefined;

	function setTemperature(temperature: number) {
		$prompter.options.temperature = temperature;
	}
	function setRequestMode(format: 'json' | 'plain' | unknown) {
		$prompter.ollamaBody.format = format as 'json' | 'plain';
	}
</script>

<div class="p-1 flex-align-middle theme-bg rounded-md pb-2">
	<div class="flex-1 text-center relative">
		<svelte:component this={component} />
		<button on:click={() => ui.showHidePromptMenu()}>{$t('prompt.systemPrompt')}</button>
	</div>
	<div class="flex justify-center gauge relative">
		<div class="absolute -left-10"><Icon icon="mdi:temperature" class="md" /></div>
		{#each Object.keys($settings.temperatures ?? {}) as temperature}
			{@const active = $prompter.options.temperature == $settings.temperatures[temperature]}
			<button
				on:click={() => {
					setTemperature($settings.temperatures[temperature]);
				}}
				class:active
				class="button-temp">{temperature}</button
			>
		{/each}
	</div>
	<div class="flex-1 flex-align-middle justify-center gap-2">
		<Icon icon="charm:binary" class="sm" />
		<Selector values={['json', 'plain']} value={$prompter.ollamaBody.format} let:item>
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
