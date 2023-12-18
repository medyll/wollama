<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/ui/InfoLine.svelte';
	import { ApiCall } from '$lib/tools/apiCall';

	let pullStatus = '';
	let addModel = '';
	let progress: number;

	function pullModel() {
		if (addModel.trim() == '') return;
		console.log(addModel);
		ApiCall.pullModel(addModel, (res) => {
			console.log(res);
			pullStatus = res?.status ?? res?.error;
			if (res.digest) {
				progress = res.completed - res.total;
			}
		});
	}
</script>

<InfoLine title={$t('settings.pull_model')}>
	<select slot="input" class="w-full" bind:value={$settings.defaultModel}>
		<option>{$t('settings.default_model')}</option>
		{#each $settings?.ollamaModels ?? [] as model}
			{@const partial = model.name.split(':')[0]}
			{@const selected = model.name === $settings.defaultModel}
			<option {selected} value={model.name}>
				{selected ? 'default model: ' : '-'}
				{model.name}
			</option>
		{/each}
	</select>
</InfoLine>
<hr />
<InfoLine vertical title={$t('settings.pull_model') + ' ' + pullStatus}>
	<form on:submit|preventDefault={(e) => pullModel} class="flex">
		<input
			bind:value={addModel}
			placeholder={$t('settings.enter_model')}
			type="text"
			class="w-full"
		/>
		<button on:click={pullModel}>
			<Icon icon="mdi:download" />
		</button>
	</form>
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
