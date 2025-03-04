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

<style lang="postcss">
	@reference "../../styles/references.css";
	.active{
		@apply  border border-b-2 border-neutral-500; /* active */
	}
	.inactive{
		@apply  opacity-60 border border-b-2 border-transparent; /* inactive */
	}
	/* @apply  border border-b-2 border-neutral-500; 
	@apply  opacity-60 border border-b-2 border-transparent;   */
</style>
