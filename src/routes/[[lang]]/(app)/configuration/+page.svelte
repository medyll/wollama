<script lang="ts">
	import { page } from '$app/stores';
	import Advanced from '$components/settings/mdl/Advanced.svelte'; 
    import type { PageData } from './$types';
    
    export let data: PageData;

    
</script>

<Advanced />