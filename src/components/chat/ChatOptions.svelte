<script lang="ts">
	import { Icon } from '@medyll/idae-slotui-svelte';
	import { t } from '$lib/stores/i18n';
	import { chatParametersState } from '$lib/states/chat.svelte';
	import Model from './input/Model.svelte';
	import Attachment from './input/Attachment.svelte';
	import { idbQuery } from '$lib/db/dbQuery';
	import CollectionListMenu from '$components/form/CollectionListMenu.svelte';

	// let promptList = $derived(idbQuery.getPrompts());
	let promptList = idbQuery.getPrompts();

	/*function setTemperature(temperature: number) {
	 chatParamsState.temperature = temperature;
	 }

	 function setRequestMode(format: 'json' | 'plain') {
	 chatParamsState.format = format;
	 }*/

	let showHide = $state(false);
	let style = $derived(showHide ? 'display: contents;' : 'display: none;content-visibility:hidden');
</script>

<!--<ChatSystemPrompt/>-->

<button class="flex gap-1" popovertarget="popover" style="anchor-name: --anchor;position:relative">
	<Icon icon="material-symbols-light:post-add-sharp" />
	{chatParametersState.promptSystem?.code ?? $t('prompt.systemPrompt')}
</button>
<div class="popover" id="popover" popover style="position-anchor : --anchor;">
	<CollectionListMenu collection="prompts" onclick={(prompt) => (chatParametersState.promptSystem = prompt)} />
</div>
<Attachment bind:imageFile={chatParametersState.images} disabled={false} form="prompt-form" />
<div class="flex-h flex-align-middle gap-2">
	<Icon icon="mdi:temperature" />
	{chatParametersState?.temperature}
	<Icon icon="bx:brain" />
	<Model bind:activeModels={chatParametersState.models} />
	<!-- {chatParamsState?.models}
	<Icon icon="charm:binary" />
	{chatParamsState?.format} -->
</div>

<style lang="postcss">
	@reference "../../styles/references.css";

	[popover] {
		border: 0;
		inset: unset;
		margin: 0;
		padding: 0;
		position: fixed;
	}

	:popover-open {
		background-color: var(--cfab-bg);
		bottom: anchor(--anchor top);
		color: var(--cfab-foreground);
		left: anchor(--anchor left);

		position-anchor: --anchor;
		right: anchor(--anchor right);

		width: 200px;
		@apply shadow-md;
		@apply rounded-md;
	}
</style>
