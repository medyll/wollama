<script lang="ts">
	let className = '';
	export let values: any = [];
	export let value: any | undefined = undefined;
</script>

{#each values as valueO}
	<div class={' ' + (valueO == value ? 'active ' : 'inactive')}>
		<slot item={valueO} active={valueO === value} />
	</div>
{/each}
{#if !values.length}
	<slot name="selectorFallback" />
{/if}

<style>
	.active {
		@apply border-b-2 border-neutral-500;
	}
	.inactive {
		@apply opacity-60 border-b-2 border-transparent;
	}
</style>
