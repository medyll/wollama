<script lang="ts">
	import { settings } from '$lib/stores/settings.js';

	function changeHandler(event: Event) {
		console.log(event.target.value);
	}
</script>

<div class="p-3 flex flex-wrap gap-2">
	{#each $settings?.chatModelKeys ?? [1, 2] as modelKey}
		<div>
			<select>
				{#each $settings?.models ?? [] as model}
					<option on:change={changeHandler} value={model}>{model.name}</option>
				{/each}
			</select>
		</div>
	{/each}
</div>

 