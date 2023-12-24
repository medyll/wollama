<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { ApiCall } from '$lib/tools/apiCall';
	import { pullModelState } from '$lib/stores';
	import List from '$components/fragments/List.svelte';

	let pullStatus = '';
	let addModel = '';
	let progress: number = 0;

	function pullModel() {
		if (addModel.trim() == '') return;

		ApiCall.pullModel(addModel, (res) => {
			$pullModelState = res;
			pullStatus = res?.status ?? res?.error;
			if (res.digest) {
				progress = res.completed - res.total;
			}
		});
	}

	function deleteModel() {
		if (addModel.trim() == '') return;

		ApiCall.deleteModel(addModel);
	}
</script>

<InfoLine title={$t('settings.default_model')}>
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
	<form on:submit|preventDefault={(e) => pullModel}>
		<progress hidden={progress === 0} class="w-full" value={progress} max="100"></progress>
		<div class="flex">
			<input
				bind:value={addModel}
				placeholder={$t('settings.enter_model')}
				type="text"
				class="w-full"
			/>
			<button on:click={pullModel}>
				<Icon icon="mdi:download" />
			</button>
		</div>
	</form>
</InfoLine>
<hr />
<InfoLine title={$t('settings.default_model')} vertical>
	<List class="flex flex-col gap-2" data={$settings?.ollamaModels ?? []} let:item let:idx>
		<div class="flex-align-middle gap-8">
			<div>{idx + 1}</div>
			<div class="flex-1">{item.name}</div>
		</div>
	</List>
</InfoLine>
