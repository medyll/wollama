<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { WollamaApi } from '$lib/db/wollamaApi';
	import { pullModelState } from '$lib/stores';
	import List from '$components/fragments/List.svelte';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { notifierState } from '$lib/stores/notifications';

	let pullStatus = '';
	let addModel = '';
	let progress: number = 0;
	let progressMax = 100;

	function pullModel() {
		if (addModel.trim() == '') return;

		WollamaApi.pull(addModel, (res) => {
			$pullModelState = res;
			pullStatus = res?.status ?? res?.error;
			if (res.digest) {
				progress = res.completed;
				progressMax = res.total;
			}
		});
	}

	function deleteModel(model: string) {
		WollamaApi.delete(model.trim())
			.then(async () => {
				notifierState.notify('success', $t('settings.delete_model_success'), 'delete-model');
				let models = (await ollamaFetcher.listModels()) ?? [];
				settings.setSetting('ollamaModels', [...models]);
			})
			.catch((e) => {
				console.log(e);
				notifierState.notify('error', e?.error ?? $t('settings.delete_model_error'), 'delete-model');
			});
	}
</script>

<div style="padding: 1rem">
	<InfoLine title={$t('settings.default_model')}>
		<select bind:value={$settings.defaultModel} class="w-full">
			<option>{$t('settings.default_model')}</option>
			{#each $settings?.ollamaModels ?? [] as model}
				{@const selected = model.name === $settings.defaultModel}
				<option {selected} value={model.name}>
					{selected ? 'default model: ' : '-'}
					{model.name}
				</option>
			{/each}
		</select>
	</InfoLine>
	<hr />
	<InfoLine title={$t('settings.pull_model') + ': ' + pullStatus} vertical>
		<form name="pull-form" on:submit|preventDefault={(e) => pullModel} />
		<progress class="w-full" hidden={progress === 0} max={progressMax} value={progress}></progress>
		<div class="flex gap-2">
			<input bind:value={addModel} class="w-full" form="pull-form" placeholder={$t('settings.enter_model')} type="text" />
			<button disabled={addModel.trim() == ''} form="pull-form" on:click={pullModel}>
				<Icon icon="mdi:download" />
			</button>
		</div>
	</InfoLine>
	<hr />
	<InfoLine title={$t('settings.modelList')} vertical>
		<List class="flex flex-col gap-2" data={$settings?.ollamaModels ?? []} let:idx let:item>
			<div class="flex-align-middle gap-8 p-1 hover:bg-white/5 hover:shadow-md">
				<div class="w-8">{idx + 1}</div>
				<div class="flex-1">{item.name}</div>
				<div>
					<Confirm
						message={$t('settings.delete_model_message')}
						validate={() => {
							deleteModel(item.name);
						}}
					>
						<button class="btn btn-red" title={$t('settings.delete_model')}>
							<Icon icon="mdi:delete" />
						</button>
					</Confirm>
				</div>
			</div>
		</List>
	</InfoLine>
</div>

<style lang="postcss">
	@reference "../../../styles/references.css";
</style>
