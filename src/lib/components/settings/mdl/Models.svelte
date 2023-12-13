<script lang="ts">
	import { t } from '$lib/i18n';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import InfoLine from '$lib/components/ui/InfoLine.svelte';

	let defaultModel = '';

	function registerDefaultModel() {
		if (defaultModel.trim() == '') return;
		settings.setParameterValue('defaultModel', defaultModel, 'string');
	}
</script>

<InfoLine title={$t('settings.pull_model')}>
	<input
		bind:value={defaultModel}
		slot="input"
		placeholder={$t('settings.enter_model')}
		type="text"
		class="w-full"
	/>
	<button on:click={registerDefaultModel}>
		<Icon icon="mdi:content-save" />
	</button>
</InfoLine>
<hr />
<InfoLine title={$t('settings.model_delete')}>
	<select slot="input" placeholder={$t('settings.enter_model')} class="w-full">
		{#each $settings?.ollamaModels ?? [] as model}
			{@const partial = model.name.split(':')[0]}
			<option value={model.name}>{model.name}</option>
		{/each}
	</select>
	<button>
		<Icon icon="mdi:delete" />
	</button>
</InfoLine>
