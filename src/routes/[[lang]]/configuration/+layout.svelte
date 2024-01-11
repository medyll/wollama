<script lang="ts">
	import { page } from '$app/stores';
	import Selector from '$components/fragments/Selector.svelte';
	import { t } from '$lib/stores/i18n';
	import { engine } from '$lib/tools/engine';
	import Icon from '@iconify/svelte';

	const tabs = ['ollama', 'model', 'create'];

	$: activeTab = $page.params?.config ?? 'ollama';
</script>

<div class="h-full w-full overflow-hidden pl-8">
	<div class="h-full w-full flex flex-col overflow-auto px-4">
		<div class="header">
			<div class="p-8 text-lg">
				<Icon icon="mdi:server-network" class="mr-2" />
				{$t(`configuration.home`)}
			</div>
			<div class="pl-4 flex-align-middle gap-8">
				<Selector value={activeTab} values={tabs} let:item>
					<button
						class="text-lg"
						on:click={() => {
							engine.goto(`/configuration/${item}`);
							activeTab = item;
						}}>{item}</button
					>
				</Selector>
			</div>
		</div>
		<hr />
		<div class=" ">
			<div class="application-container">
				<slot />
			</div>
		</div>
	</div>
</div>
<style lang="postcss">
.header {
		@apply sticky top-2 z-10;
		background-image: var(--cfab-gradient);
		background-size: 100vh 100vw;
		background-position: top;
	}
</style>