<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '../stores/messages';
	// import hljs from 'highlight';
	// import 'highlight.js/styles/github-dark.min.css';

	import { marked } from 'marked';
	export let message: MessageType;

	$: if (message) {
		console.log(message?.content)
		// hljs.highlightAll();
	}
</script>

<div class="w-full flex grid gap-4x border dark:border-gray-600 mb-5 rounded-md">
	<div class="flex mr-4 content-center">
		<div class="p-2"><Icon icon="mdi:user" /></div>
		<div class="flex-1 font-bold p-2">{message.role}</div>
	</div>
	<div class="flex-1 px-2 whitespace-pre-line">
		{@html message?.content ? marked(message?.content) : ''}
	</div>
</div>
