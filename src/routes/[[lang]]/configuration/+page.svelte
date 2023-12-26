<script lang="ts">
	import { page } from '$app/stores';
	import Options from '$components/settings/mdl/Options.svelte'; 
    import type { PageData } from './$types';
    
    export let data: PageData;

    
</script>

<Options />