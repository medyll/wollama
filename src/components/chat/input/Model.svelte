<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte';
	import Icon from '@iconify/svelte';

	export let activeModels: string[] ;

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
 
<div class="line-gap-2 flex-wrap sticky top-0"> 
	{#each appModels as modelKey, index (index)}
 
		{@const showAdd = index === activeModels.length - 1}
		{@const showRemove = index === 0}
		{@const filteredOptions = ($settings?.ollamaModels ?? []).filter((model) => model.name === modelKey || !appModels.includes(model.name))}
		<div class="line-gap-2 border-b">
			<div class="flex-1">
				<select class="naked inline w-32" onchange={changeHandler(index)}>
					{#each filteredOptions as model}
						<option selected={model.name === modelKey} value={model.name}>{model.name} </option>
					{/each}
				</select>
			</div>
			<div class="line-gap-2">
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
			</div>
		</div>
	{/each}
</div>
