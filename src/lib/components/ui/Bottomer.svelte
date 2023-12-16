<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { ui } from '$lib/stores/ui';
	import { onMount } from 'svelte';

	let element: HTMLElement;

	$: if (element && $activeChatId && $ui.autoScroll?.[$activeChatId]) scrollDown();

	chatter.subscribe((chat) => {
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
