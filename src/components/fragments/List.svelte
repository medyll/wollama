<script lang="ts">
	let className: string = '';
	export let data: any[];
	export { className as class };
	export let naked = false;
</script>

{#if naked}
	{#each data ?? [] as item}
		<slot {item} />
	{/each}
{:else}
	<div class={className}>
		{#each data ?? [] as item}
			<slot {item} />
		{/each}
	</div>
{/if}
