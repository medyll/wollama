<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '../../stores/messages';
	import highlight from 'highlight.js';
	import 'highlight.js/styles/github-dark.min.css';

	let element: HTMLElement;

	import { marked } from 'marked';
	import { t } from '$lib/i18n';
	import Skeleton from '../ui/Skeleton.svelte';
	export let message: MessageType;

	$: icon = message.role === 'user' ? 'lets-icons:user-scan-light' : 'icon-park:robot-one';

	$: if (element && message?.content) {
		formatText();
	}

	function formatText() {
		if (element) {
			element.querySelectorAll('code').forEach(async (block) => {
				block.innerHTML = await marked(block.innerHTML);
				highlight.highlightElement(block);
			});
		} else {
			setTimeout(formatText, 100);
		}
	}
</script>

<div class="flex-v w-full gap-1 mb-4 relative overflow-hidden" bind:this={element}>
	<div class="flex-align-middle">
		<div class="w-12 text-center"><Icon style="font-size:1.6em" {icon} /></div>
		<div class="flex-1 font-bold capitalize">{$t(`ui.messageRole_${message.role}`)}</div>
	</div>
	<div class="flex-1 ml-12 relative overflow-hidden">
		{#if [undefined, ''].includes(message?.content)}
			<Skeleton class="h-full" />
		{:else}
			{@html marked.parse(message?.content)};
		{/if}
	</div>
</div>

<style lang="postcss">
	.skeletonLine {
		@apply h-2 bg-gray-200 dark:bg-gray-600 rounded-md col-span-2 mb-1 animate-pulse;
	}
</style>
