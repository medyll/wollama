<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '../../stores/messages';
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

	$: icon = message.role === 'user' ? 'lets-icons:user-scan-light' : 'icon-park:robot-one';
</script>

<div bind:this={element} class="w-full flex flex-col gap-1 mb-4">
	<div class="flex items-center">
		<div class="w-12 text-center"><Icon style="font-size:1.6em" {icon} /></div>
		<div class="flex-1 font-bold capitalize">{message.role}</div>
	</div>
	<div class="flex-1 whitespace-pre-line ml-12">
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
