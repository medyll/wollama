<script lang="ts">
	import { slide } from 'svelte/transition';

	export let showPanel: boolean = true;
	export let panelMode: 'expanded' | 'reduced' = 'expanded';
</script>

<div class="flex  gap-4 h-full relative">
	{#if showPanel}
		<div transition:slide={{ axis: 'x' }} class="w-64 overflow-auto overflow-x-hidden paper h-64">
			<slot name="leftNav" />
		</div>
	{/if}
	<div class="flex-1">
		<div class="w-96 h-full flex-col flex gap-1">
			<slot />
		</div>
	</div>
</div>
