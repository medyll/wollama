<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import { OllamaOptionsDefaults, ollamaOptionsInfo } from '$configuration/configuration';
	import List from '$components/fragments/List.svelte';
	import Icon from '@iconify/svelte';
	import { ApiCall } from '$lib/db/apiCall';
	import { notifierState } from '$lib/stores/notifications';
	import Confirm from '$components/fragments/Confirm.svelte';
	import { ollamaParams } from '$lib/stores/ollamaParams';

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
<hr />
<div class="flex-align-middle gap-8">
	<div class="soft-title p-2 py-4">Options</div>
	<div>
		<Confirm validate={() => {ollamaParams.resetAll()}} message={$t('settings.resetOllamaOptions')}>
			{$t('settings.resetAll')}
		</Confirm>
	</div>
</div>
<List data={Object.keys(OllamaOptionsDefaults)} let:item={setting}>
	<div class="flex-align-middle gap-2">
		<div title={ollamaOptionsInfo?.[setting]} class="flex-1">{setting}</div>
		<div>
			{#if OllamaOptionsDefaults?.[setting]?.max}
				<div class="flex-align-middle gap-2">
					<input
						type="range"
						min={OllamaOptionsDefaults?.[setting].min}
						max={OllamaOptionsDefaults?.[setting].max}
						step={OllamaOptionsDefaults?.[setting].max / 10}
						bind:value={$ollamaParams[setting]}
					/>
					<input
						class="w-16 text-center border-none theme-bg"
						type="text"
						bind:value={$ollamaParams[setting]}
					/>
				</div>
			{:else}
				<input
					class="w-16 text-center border-none theme-bg"
					type="text"
					bind:value={$ollamaParams[setting]}
				/>
			{/if}
		</div>
		<div class="w-16"><button on:click={()=>{ollamaParams.resetParam(setting)}}>reset</button></div>
	</div>
	<hr />
</List>

<style>
	.inputTiny {
		width: 3rem;
	}
</style>
