<script lang="ts">
	import { page } from '$app/state';
	import Options from '$components/settings/mdl/Options.svelte';
	import Models from '$components/settings/mdl/Models.svelte';

	$: tab = page.params?.config ?? 'ollama';
</script>

{#if tab == 'create'}
	ss
{:else if tab == 'model'}
	<Models />
{:else}
	<Options />
{/if}
