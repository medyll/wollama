<script lang="ts">
	import { t } from '$lib/stores/i18n';
	import { settings } from '$lib/stores/settings';
	import { OllamaOptionsDefaults, ollamaOptionsRanges } from '$configuration/configuration';
	import List from '$components/fragments/List.svelte';
	import Icon from '@iconify/svelte';
	import { ApiCall } from '$lib/tools/apiCall';
	import { notifierState } from '$lib/stores/notifications';

	let ollama_server = $settings.ollama_server;

	function setEndPoint(url:string){
		ApiCall.ping(url).then((res)=>{ 
			notifierState.notify('success', $t('settings.server_url_success'), 'server-url');
			settings.setSetting('ollama_server', url);
		}).catch((e)=>{ 
			notifierState.notify('error', $t('settings.server_url_error'), 'server-url');
		});
		// 
	}
</script>

<div class="soft-title p-2 py-4">{$t('settings.server_url')}</div>
<form
	on:submit|preventDefault={(e) => {
		setEndPoint(ollama_server)
	}}
	class="flex gap-2"
>
	<input bind:value={ollama_server} class="flex-1" type="text" />
	<button
		on:click={() => {
			setEndPoint(ollama_server)
		}}
			type="submit"
		title={$t('settings.test_connection')}
		class="aspect-square"
		><Icon class="md" icon="iconoir:server-connection" />
	</button>
</form>
<hr />
<div class="soft-title p-2  py-4">Options</div>
<List data={Object.keys(OllamaOptionsDefaults)} let:item={setting}>
	<div class="flex-align-middle gap-2">
		<div class="flex-1">{setting}</div>
		<div>
			{#if Array.isArray(ollamaOptionsRanges[setting])}
				<input
					type="range"
					min={ollamaOptionsRanges[setting][0]}
					max={ollamaOptionsRanges[setting][1]}
					step={ollamaOptionsRanges[setting][2]}
					bind:value={$settings.ollamaOptions[setting]}
				/>
			{:else}
				<input class="inputTiny" type="text" bind:value={$settings.ollamaOptions[setting]} />
			{/if}
		</div>
		<div class="w-16 text-center">{$settings.ollamaOptions[setting] ?? ''}</div>
		<div class="w-16"><button>reset</button></div>
	</div>
	<hr />
</List>

<style>
	.inputTiny {
		width: 3rem;
	}
</style>
