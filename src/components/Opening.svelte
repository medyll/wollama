<script lang="ts">
	import { onMount } from 'svelte';

	let showOpener: boolean = true;

	onMount(() => {
		setTimeout(() => {
			showOpener = false;
		}, 500);
	});
</script>

{#if showOpener}
	<div class="fixed h-full w-full theme-bg z-40 backdrop-blur bg-white/80"></div>
{/if}
<slot />
