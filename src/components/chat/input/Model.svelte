<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import {Icon} from '@medyll/idae-slotui-svelte';
	import { chatParamsState } from '$lib/states/chat.svelte';

	let {activeModels = $bindable([])}: {
		activeModels: string[];
	} = $props()

	let appModels: string[] = $settings.defaultModel ? [$settings.defaultModel] : [];

	const changeHandler = (index: number) => (event: Event) => {
		activeModels[index] = event?.target?.value;
	};

	function addModelKey() {
		const newModel = ($settings?.ollamaModels ?? []).filter((model) => !activeModels.includes(model.name))?.[0];
		activeModels = [...activeModels, newModel?.name ?? '...'];
	}

	function removeModelKey(index: number) {
		activeModels = activeModels.filter((_, i) => i !== index);
	}
 
  
</script>

<div class=" flex-wrap"> 
	{#each appModels as modelKey, index (index)} 
		{@const showAdd = index === activeModels.length - 1}
		{@const showRemove = index === 0}
		{@const filteredOptions = ($settings?.ollamaModels ?? []).filter((model) => model.name === modelKey || !appModels.includes(model.name))}		 

		<div class="line-gap-2 border-b">
			<div class="flex-1">
				<button class="anchor" popovertarget="popover-{index}"  style="anchor-name: --anchor-{index};" >{chatParamsState?.models}</button>
				<!-- <input id="model-{index}" type="text" value=""   list="model-options-{index}"    oninput={changeHandler(index)} />			 
				<select id="model-options-{index}">
					{#each filteredOptions as model}
						<option value={model.name} />
					{/each}
				</select> -->
				<div popover class="popover " id="popover-{index}" style="position-anchor : --anchor-{index};"> 
				<div class="flex-col flex gap-1">
				
					{#each filteredOptions as model}
						<button  onclick={changeHandler(index)}  value={model.name} >{model.name}</button>  
					{/each}
				</div>
				</div>
			</div>
			<!-- <div class="line-gap-2">
				<button
					hidden={showRemove}
					onclick={() => {
						removeModelKey(index);
					}}
				>
					<Icon icon="mdi:minus" style="font-size:1.6em" />
				</button>
				<button hidden={!showAdd} onclick={addModelKey}>
					<Icon icon="mdi:plus" style="font-size:1.6em" />
				</button>
			</div> -->
		</div>
	{/each}
</div>
<style>
:popover-open {
	width: 200px; 
	position: absolute;
	inset: unset; 
	margin: 0; 
}
.anchor {
	anchor-name: --myAnchor;
	display: inline-block;  
}

.popover {
	position-anchor: --myAnchor;
	position: fixed;
	left: anchor(left);
	bottom: anchor(top);  
	padding: 10px;
	z-index:9000;
	width: auto;
	text-align:left;
}
 
</style>