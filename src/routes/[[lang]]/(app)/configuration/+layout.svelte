<script lang="ts">
	import Selector from '$components/fragments/Selector.svelte';
	import Advanced from '$components/settings/mdl/Advanced.svelte';
	import { t } from '$lib/stores/i18n';
	import { engine } from '$lib/tools/engine';

	const tabs = ['ollama', 'model'];

	let activeTab = 'ollama';
</script>

<div class="h-full w-full overflow-hidden pl-12">
	<div class="h-full w-full flex flex-col overflow-hidden">
		<div class="p-8 text-lg">
			{$t(`configuration.home`)}
		</div>
		<hr />
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
				<slot>
				</slot>
			</div>
		</div>
	</div>
</div>
