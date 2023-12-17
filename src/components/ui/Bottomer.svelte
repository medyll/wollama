<script lang="ts">
	import { ui } from '$lib/stores/ui';
	import { onMount } from 'svelte';

	let element: HTMLElement;

	$: if (element && $ui.activeChatId && $ui.autoScroll?.[$ui.activeChatId]) scrollDown();

	ui.subscribe((chat) => {
		scrollDown();
	});

	onMount(() => {
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
<div bind:this={element} />
