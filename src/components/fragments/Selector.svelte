<script lang="ts">
	let className = '';
	export let values: any = [];
	export let value: any | undefined = undefined;
 
</script>

{#each values as valueO}
	<div class={valueO == value ? 'active ' : 'opacity-60'}>
		<slot item={valueO} active={valueO === value} />
	</div>
{/each}

<style>
	.active {
		@apply border-b-2 border-neutral-500;
	}
</style>
