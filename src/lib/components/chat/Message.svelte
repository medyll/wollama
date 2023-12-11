<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '../../stores/messages';
	/* import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.min.css';  */

	import { marked } from 'marked';
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import Skeleton from '../ui/Skeleton.svelte';
	export let message: MessageType;

	let element: HTMLElement;

	onMount(() => {
		// hljs.highlightAll();
		element.scrollIntoView({
			block: 'end',
			behavior: 'smooth'
		});
	});
	$: if (message && element) {
		element.scrollIntoView({
			block: 'end',
			behavior: 'smooth'
		});
	}

	$: icon = message.role === 'user' ? 'lets-icons:user-scan-light' : 'icon-park:robot-one';
</script>

<div bind:this={element} class="flex-v w-full gap-1 mb-4">
	<div class="flex-align-middle">
		<div class="w-12 text-center"><Icon style="font-size:1.6em" {icon} /></div>
		<div class="flex-1 font-bold capitalize">{$t(`ui.messageRole_${message.role}`)}</div>
	</div>
	<div class="flex-1 whitespace-pre-line ml-12 relative">
		{#if [undefined, ''].includes(message?.content)}
			<Skeleton class="h-full" />
		{:else}
			{@html message?.content ? marked(message?.content) : ''}
		{/if}
	</div>
</div>

<style lang="postcss">
	.skeletonLine {
		@apply h-2 bg-gray-200 dark:bg-gray-600 rounded-md col-span-2 mb-1 animate-pulse;
	}
</style>
