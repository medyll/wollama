<script lang="ts">
	import { settings } from '$lib/stores/settings.js';
	import Icon from '@iconify/svelte';

	export let activeModels: string[] = $settings.defaultModel ? [$settings.defaultModel] : [];

	const changeHandler = (index: number) => (event: Event) => {
		activeModels[index] = event?.target?.value;
	};

	function addModelKey() {
		const newModel = ($settings?.ollamaModels ?? []).filter(
			(model) => !activeModels.includes(model.name)
		)?.[0];
		activeModels = [...activeModels, newModel?.name ?? '...'];
	}

	function removeModelKey(index: number) {
		console.log(index);
		activeModels = activeModels.filter((_, i) => i !== index);
	}
</script>

<div class="flex-align-middle flex-wrap gap-2 sticky top-0">
	{#each activeModels as modelKey, index (index)}
		{@const showAdd = index === activeModels.length - 1}
		{@const showRemove = index === 0}
		{@const filteredOptions = ($settings?.ollamaModels ?? []).filter(
			(model) => model.name === modelKey || !activeModels.includes(model.name)
		)}
		<div class="flex-align-middle gap-2   border-b">
			<div class="flex-1">
				<select class="naked inline w-32" on:change={changeHandler(index)}>
					{#each filteredOptions as model}
						<option selected={model.name === modelKey} value={model.name}>{model.name} </option>
					{/each}
				</select>
			</div>
			<div class="flex-align-middle gap-2">
				<button
					hidden={showRemove}
					on:click={() => {
						removeModelKey(index);
					}}
				>
					<Icon icon="mdi:minus" style="font-size:1.6em" />
				</button>
				<button hidden={!showAdd} on:click={addModelKey}>
					<Icon icon="mdi:plus" style="font-size:1.6em" />
				</button>
			</div>
		</div>
	{/each}
</div>
