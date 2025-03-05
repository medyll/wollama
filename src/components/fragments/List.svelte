<script lang="ts">
	let className: string = '';
	export let data: any[];
	export { className as class };
	export let naked = false;
	export let title: string = '';
</script>

{#if naked}
	{title}
	{#each data ?? [] as item}
		<slot {item} />
	{/each}
{:else}
	{title}
	<div class={className}>
		{#each data ?? [] as item, idx}
			<slot {item} {idx} />
		{/each}
	</div>
{/if}
