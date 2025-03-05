<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import { onMount } from 'svelte';

	let element: HTMLElement;

	$: if (element && $ui.activeChatId && $ui.autoScroll?.[$ui.activeChatId]) scrollDown();

	ui.subscribe((chat) => {
		scrollDown();
	});

	function scrollDown() {
		if (element && $ui.autoScroll?.[$ui.activeChatId])
			setTimeout(() => {
				element?.scrollIntoView({
					behavior: 'smooth',
					block:    'end'
				});
			}, 0);
	}
</script>

<div class="flex-1" />
<div class="h-32 p-4" bind:this={element} />
