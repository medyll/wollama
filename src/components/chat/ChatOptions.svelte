<script lang="ts">
	import { Icon, MenuListItem } from '@medyll/idae-slotui-svelte';
	import { t } from '$lib/stores/i18n';
	import { chatParamsState } from '$lib/states/chat.svelte';
	import Model from './input/Model.svelte';
	import Attachment from './input/Attachment.svelte';
	import { idbQuery } from '$lib/db/dbQuery';
	import ChatSystemPrompt from '$components/chat/ChatSystemPrompt.svelte';


	// let promptList = $derived(idbQuery.getPrompts());
	let promptList = idbQuery.getPrompts();

	/*function setTemperature(temperature: number) {
	 chatParamsState.temperature = temperature;
	 }

	 function setRequestMode(format: 'json' | 'plain') {
	 chatParamsState.format = format;
	 }*/

	let showHide = $state(false);
	let style    = $derived(showHide ? 'display: contents;' : 'display: none;content-visibility:hidden');
</script>

<!--<ChatSystemPrompt/>-->
{#snippet listItemBottom({ item, itemIndex })}
	<MenuListItem icon="material-symbols-light:post-add-sharp" data={item}>
		{$t('prompt.createPrompt')}
	</MenuListItem>
{/snippet}

<button class="flex gap-1" popovertarget="popover" style="anchor-name: --anchor;position:relative">
	<Icon icon="material-symbols-light:post-add-sharp" />
	{chatParamsState.promptSystem?.code ?? $t('prompt.systemPrompt')}
</button>
<div class="popover " id="popover" popover style="position-anchor : --anchor;">
	<div class="slotui-menulist " tall="med">
		{#each promptList as prompt}
			<button class="menulist-item" value={prompt.name} onclick={() => chatParamsState.promptSystem = prompt}>{prompt.name}</button>
		{/each}
		<button class="menulist-item">
			<Icon icon="mdi:plus" />
			{$t('prompt.createPrompt')}
		</button>
	</div>
</div>
<Attachment bind:imageFile={chatParamsState.images} disabled={false} form="prompt-form" />
<div class="flex-h flex-align-middle gap-2">
	<Icon icon="mdi:temperature" />
	{chatParamsState?.temperature}
	<Icon icon="bx:brain" />
	<Model bind:activeModels={chatParamsState.models} />
	<!-- {chatParamsState?.models}
	<Icon icon="charm:binary" />
	{chatParamsState?.format} -->
</div>

<style lang="postcss">
    @reference "../../styles/references.css";



    [popover] {
        inset: unset;
        border: 0;
        margin: 0;
        padding: 0;
        position: fixed;
    }

    :popover-open {
        position-anchor: --anchor;
        bottom: anchor(--anchor top);
        left: anchor(--anchor left);
        right: anchor(--anchor right);

        background-color: var(--cfab-bg);
        color: var(--cfab-foreground);

        width: 200px;
        @apply shadow-md;
        @apply rounded-md;
    }


</style>
