<script lang="ts">
    import type { LayoutData } from './$types';
    
    export let data: LayoutData;
</script>

<svelte:window
    on:scroll={(e) => {
       // autoScroll = window.innerHeight + window.scrollY >= document.body.offsetHeight - 40;
    }} />
<slot />