<script lang="ts">
	import { page } from '$app/stores';
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;

    $: console.log($page.params.id)
    
</script>

<svelte:window
    on:scroll={(e) => {
       // autoScroll = window.innerHeight + window.scrollY >= document.body.offsetHeight - 40;
    }} />
<slot />