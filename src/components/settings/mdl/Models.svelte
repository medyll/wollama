<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import Icon from '@iconify/svelte';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { ApiCall } from '$lib/db/apiCall';
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

		ApiCall.pullModel(addModel, (res) => { 
			$pullModelState = res;
			pullStatus = res?.status ?? res?.error;
			if (res.digest) {
				progress = res.completed;
				progressMax = res.total;
			}
		});
	}

	function deleteModel(model: string) {
		ApiCall.deleteModel(model.trim())
			.then(async () => {
				notifierState.notify('success', $t('settings.delete_model_success'), 'delete-model');
				let models = (await ollamaFetcher.listModels()) ?? [];
				settings.setSetting('ollamaModels', [...models]);
			})
			.catch((e) => {
				console.log(e);
				notifierState.notify(
					'error',
					e?.error ?? $t('settings.delete_model_error'),
					'delete-model'
				);
			});
	}
</script>

<InfoLine title={$t('settings.default_model')}>
	<select class="w-full" bind:value={$settings.defaultModel}>
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
<InfoLine vertical title={$t('settings.pull_model') + ': ' + pullStatus}>
	<form name="pull-form" on:submit|preventDefault={(e) => pullModel} />
	<progress hidden={progress === 0} class="w-full" value={progress} max={progressMax}></progress>
	<div class="flex gap-2">
		<input
			bind:value={addModel}
			placeholder={$t('settings.enter_model')}
			type="text"
			class="w-full"
			form="pull-form"
		/>
		<button disabled={addModel.trim() == ''} form="pull-form" on:click={pullModel}>
			<Icon icon="mdi:download" />
		</button>
	</div>
</InfoLine>
<hr />
<InfoLine title={$t('settings.modelList')} vertical>
	<List class="flex flex-col gap-2" data={$settings?.ollamaModels ?? []} let:item let:idx>
		<div class="flex-align-middle gap-8 p-1 hover:bg-white/5 hover:shadow-md">
			<div class="w-8">{idx + 1}</div>
			<div class="flex-1">{item.name}</div>
			<div>
				<Confirm
					validate={() => {
						deleteModel(item.name);
					}}
					message={$t('settings.delete_model_message')}
				>
					<button title={$t('settings.delete_model')} class="btn btn-red">
						<Icon icon="mdi:delete" />
					</button>
				</Confirm>
			</div>
		</div>
	</List>
</InfoLine>
