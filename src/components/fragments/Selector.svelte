<script lang="ts">
	export let values: any = [];
	export let value:any|undefined = undefined; 
</script>

{#each values as valueO}
	<div><slot item={valueO} active={valueO === value} /></div>
{/each}
