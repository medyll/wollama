<script lang="ts">
	import { activeChatId, chatter } from '$lib/stores/chatter';
	import { set } from 'date-fns';
	import { onMount } from 'svelte';

	let element: HTMLElement;

	$: if (element && $activeChatId) scrollDown();

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
			}, 200);
	}
</script>

<div class="flex-1" />
<div bind:this={element} />
