<script lang="ts">
	import { page } from '$app/stores';
	import Selector from '$components/fragments/Selector.svelte'; 
	import { t } from '$lib/stores/i18n';
	import { engine } from '$lib/tools/engine';
	import Icon from '@iconify/svelte';

	const tabs = ['ollama', 'model', 'create'];

	let activeTab = $page.params?.config ?? 'ollama';
</script>

<div class="h-full w-full overflow-hidden pl-12">
	<div class="h-full w-full flex flex-col overflow-hidden">
		<div class="p-8 text-lg">
			<Icon icon="mdi:server-network" class="mr-2" />
			{$t(`configuration.home`)}
		</div>
		<div class="pl-4 flex-align-middle gap-8">
			<Selector value={activeTab} values={tabs} let:item>
				<button
					on:click={() => {
						engine.goto(`/configuration/${item}`);
						activeTab = item;
					}}>{item}</button
				>
			</Selector>
		</div>
		<hr />
		<div class="flex-1 overflow-auto">
			<div class="container">
				<slot />
			</div>
		</div>
	</div>
</div>
