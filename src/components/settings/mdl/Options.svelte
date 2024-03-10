<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings.svelte';
	import { OllamaOptionsDefaults, ollamaOptionsCatalog, ollamaOptionsInfo } from '$configuration/configuration';
	import List from '$components/fragments/List.svelte';
	import Icon from '@iconify/svelte';
	import { OllamaApi } from '$lib/db/ollamaApi';
	import { notifierState } from '$lib/stores/notifications';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { ollamaApiMainOptionsParams } from '$lib/stores/ollamaParams';

	let ollama_server = $settings.ollama_server;

	function setEndPoint(url: string) {
		OllamaApi.ping(url)
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
				ollamaApiMainOptionsParams.resetAll();
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
					<input type="range" min={OllamaOptionsDefaults?.[setting].min} max={OllamaOptionsDefaults?.[setting].max} step={OllamaOptionsDefaults?.[setting].max / 10} bind:value={$ollamaApiMainOptionsParams[setting]} />
					<input class="w-16 text-center naked theme-bg" type="number" bind:value={$ollamaApiMainOptionsParams[setting]} />
				</div>
			{:else}
			{#if ollamaOptionsCatalog?.[setting].type=='number'}
				<input class="w-16 text-center naked theme-bg" type="number" bind:value={$ollamaApiMainOptionsParams[setting]} />

			{:else}
				<input class="w-16 text-center naked theme-bg" type="text" bind:value={$ollamaApiMainOptionsParams[setting]} />

			{/if}
			{/if}
		</div>
		<div class="w-16">
			<button
				on:click={() => {
					ollamaApiMainOptionsParams.resetParam(setting);
				}}>reset</button
			>
		</div>
	</div>
	<hr />
</List>

