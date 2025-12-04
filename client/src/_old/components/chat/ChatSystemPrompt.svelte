<script lang="ts">
	import { ollamaPayloadOptions, ollamaPayloadStore, prompter } from '$lib/stores/prompter';
	import Prompts from '$components/settings/prompts/Prompts.svelte';
	import { t } from '$lib/stores/i18n';
	import { ui } from '$lib/stores/ui';

	$: component = $ui.showPrompt ? Prompts : undefined;

	function setTemperature(temperature: number) {
		ollamaPayloadOptions.setValue('temperature', temperature);
	}

	function setRequestMode(format: 'json' | 'plain' | unknown) {
		ollamaPayloadStore.setValue('format', format);
	}
</script>

<svelte:component this={component} bind:activePrompt={$prompter.promptSystem} />
<div class="relative flex-1 text-center">
	<button on:click={() => ui.showHidePromptMenu()}>
		{$prompter.promptSystem.title ?? $t('prompt.systemPrompt')}
	</button>
</div>
