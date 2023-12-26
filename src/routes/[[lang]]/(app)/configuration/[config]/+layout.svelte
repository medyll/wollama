<script lang="ts">
	import { page } from '$app/stores';
	import Advanced from '$components/settings/mdl/Advanced.svelte';
	import Models from '$components/settings/mdl/Models.svelte'; 

    $: tab = $page.params.config;
</script>

{#if tab=='create'}
     ss
{:else if tab=='model'}
    <Models />
{:else}
    <Advanced />
{/if}  