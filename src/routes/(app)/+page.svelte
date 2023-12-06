<script lang="ts">
	import MainChat from '$lib/components/MainChat.svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>
 
<MainChat />