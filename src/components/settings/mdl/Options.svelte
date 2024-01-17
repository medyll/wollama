<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import { OllamaOptionsDefaults, ollamaOptionsCatalog, ollamaOptionsInfo } from '$configuration/configuration';
	import List from '$components/fragments/List.svelte';
	import Icon from '@iconify/svelte';
	import { ApiCall } from '$lib/db/apiCall';
	import { notifierState } from '$lib/stores/notifications';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { ollamaParams } from '$lib/stores/ollamaParams';
	import InfoLine from '$components/fragments/InfoLine.svelte';
	import { Button } from '@medyll/slot-ui';

	let ollama_server = $settings.ollama_server;

	function setEndPoint(url: string) {
		ApiCall.ping(url)
			.then((res) => {
				notifierState.notify('success', $t('settings.server_url_success'), 'server-url');
				settings.setSetting('ollama_server', url);
			})
			.catch((e) => {
				notifierState.notify('error', $t('settings.server_url_error'), 'server-url');
			});
		//
	}
 
</script>

<div class="soft-title p-2 py-4">
	{$t('settings.server_url')}
</div>

<form
	on:submit|preventDefault={(e) => {
		setEndPoint(ollama_server);
	}}
	class="flex gap-2"
>
	<input bind:value={ollama_server} class="flex-1" type="text" />
	<button
		on:click={() => {
			setEndPoint(ollama_server);
		}}
		type="submit"
		title={$t('settings.test_connection')}
		class="aspect-square"
		><Icon class="md" icon="iconoir:server-connection" />
	</button>
</form>

<!-- <hr />
<div class="soft-title p-2 py-4">
	{$t('settings.system_prompt')}
</div>
<InfoLine title={'prompt'} vertical>
	<textarea bind:value={$settings.system_prompt} cols="4" class="w-full h-24 theme-bg p-2 rounded-md" />
</InfoLine> -->
<hr />
<div class="flex-align-middle gap-8">
	<div class="soft-title p-2 py-4">Options</div>
	<div>
		<Confirm
			validate={() => {
				ollamaParams.resetAll();
			}}
			message={$t('settings.resetOllamaOptions')}
		>
			{$t('settings.resetAll')}
		</Confirm>
	</div>
</div>
<List data={Object.keys(ollamaOptionsCatalog)} let:item={setting}>
	<div class="line-gap-2 py-2">
		<div title={ollamaOptionsCatalog?.[setting].description} class="flex-1">{setting}</div>
		<div>
			{#if OllamaOptionsDefaults?.[setting]?.max}
				<div class="line-gap-2">
					<input type="range" min={OllamaOptionsDefaults?.[setting].min} max={OllamaOptionsDefaults?.[setting].max} step={OllamaOptionsDefaults?.[setting].max / 10} bind:value={$ollamaParams[setting]} />
					<input class="w-16 text-center naked theme-bg" type="number" bind:value={$ollamaParams[setting]} />
				</div>
			{:else}
			{#if ollamaOptionsCatalog?.[setting].type=='number'}
				<input class="w-16 text-center naked theme-bg" type="number" bind:value={$ollamaParams[setting]} />

			{:else}
				<input class="w-16 text-center naked theme-bg" type="text" bind:value={$ollamaParams[setting]} />

			{/if}
			{/if}
		</div>
		<div class="w-16">
			<button
				on:click={() => {
					ollamaParams.resetParam(setting);
				}}>reset</button
			>
		</div>
	</div>
	<hr />
</List>

