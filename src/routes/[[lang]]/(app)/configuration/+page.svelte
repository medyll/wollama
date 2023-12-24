<script lang="ts">
	import Advanced from '$components/settings/mdl/Advanced.svelte';
	import { t } from '$lib/stores/i18n';
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>



<h3>{$t(`configuration.home`)}</h3>
<Advanced />