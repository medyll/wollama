<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '../stores/messages';
	/* import hljs from 'highlight.js';
	import 'highlight.js/styles/github-dark.min.css';  */

	import { marked } from 'marked';
	import { onMount } from 'svelte';
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
</script>

<div
	bind:this={element}
	class="w-full flex grid gap-4x border dark:border-gray-600 mb-5 rounded-md"
>
	<div class="flex mr-4 content-center">
		<div class="p-2"><Icon icon="mdi:user" /></div>
		<div class="flex-1 font-bold p-2">{message.role}</div>
	</div>
	<div class="flex-1 px-2 whitespace-pre-line">
	{@html message?.content ? marked(message?.content) : ''}
		<!-- {#if message?.content  === ''}
			<pre class="animate-pulse"> 
				<div class="h-2 bg-gray-200 dark:bg-gray-600 rounded col-span-2" />
				<div class="h-2 bg-gray-200 dark:bg-gray-600 rounded col-span-2" />
				<div class="h-2 bg-gray-200 dark:bg-gray-600 rounded col-span-2" />
				<div class="h-2 bg-gray-200 dark:bg-gray-600 rounded col-span-2" />
			</pre>
		{:else}
			{@html message?.content ? marked(message?.content) : ''}
		{/if} -->
	</div>
</div>
