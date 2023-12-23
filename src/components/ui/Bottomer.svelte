<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import { onMount } from 'svelte';

	let element: HTMLElement;

	$: if (element && $ui.activeChatId && $ui.autoScroll?.[$ui.activeChatId]) scrollDown();

	ui.subscribe((chat) => {
		scrollDown();
	});

	function scrollDown() {
		if (element)
			setTimeout(() => {
				element?.scrollIntoView({
					block: 'end',
					behavior: 'smooth'
				});
			}, 0);
	}
</script>

<div class="flex-1" />
<div class="border p-4 h-32 theme-bg" bind:this={element} />
