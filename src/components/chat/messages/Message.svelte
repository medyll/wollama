<script lang="ts">
	import Icon from '@iconify/svelte';
	import type { MessageType } from '$types/db';

	import { marked } from 'marked';
	import { t } from '$lib/stores/i18n';
	import Skeleton from '$components/ui/Skeleton.svelte';
	import Prism from 'prismjs';
	import MessageList from './MessageList.svelte';
	export let message: MessageType;

	let element: HTMLElement;

	$: icon = message.role === 'user' ? 'lets-icons:user-scan-light' : 'icon-park:robot-one';

	marked.use({
		async: false,
		pedantic: false,
		gfm: true
	});

	function wrap(el, wrapper) {
		if (el && el.parentNode) {
			el.parentNode.insertBefore(wrapper, el);
			wrapper.appendChild(el);
		}
	}

	function copyPaste() {
		navigator.clipboard.writeText("redddd").then(
			(success) => console.log('text copied'),
			(err) => console.log('error copying text')
		);
	}

	function selectCodeTags(textString: string) {
		const parser = new DOMParser();
		const htmlString = marked.parse(textString, { async: false }) as string;
		const doc = parser.parseFromString(htmlString, 'text/html');

		const codeElements = doc.querySelectorAll('code');

		codeElements.forEach((codeElement) => {
			const lang = codeElement.classList?.[0]
				? codeElement.classList[0].replace('language-', '').trim()
				: undefined;
			if (!lang) return;
			const wrapper = document.createElement('div');
			const toolbar = document.createElement('div');
			const pre = document.createElement('pre');

			if (
				codeElement.parentElement?.tagName === 'PRE' &&
				codeElement.parentElement.childNodes.length == 1
			) {
				codeElement.parentElement.replaceWith(codeElement);
			}
			wrapper.className = 'codeFormat';
			toolbar.className = 'flex items-center p-0.5';
			wrap(codeElement, wrapper);
			wrapper.insertBefore(toolbar, codeElement);
			wrap(codeElement, pre);
			toolbar.innerHTML = `<div class="flex-1">${lang}</div><div><button copyPaste >copy code</button></div>`;
			Prism.highlightElement(codeElement);
			codeElement.dataset.lang = lang;			
		});

		return doc.body.innerHTML;
	}

	let assistantCode:string;
	$: if (message?.role == 'assistant' && message?.content && message.content.length) {
		assistantCode = selectCodeTags(message?.content);
	}

</script>

<div class="flex-v w-auto gap-1 mb-4 relative overflow-hidden" bind:this={element}>
	<div class="flex-align-middle {message?.role == 'assistant'? 'flex-row-reverse':''}">
		<div class="w-12 text-center"><Icon style="font-size:1.6em" {icon} /></div>
		<div class="font-bold capitalize">{$t(`ui.messageRole_${message.role}`)}</div>
		<div class="soft-title">{#if message?.status=='streaming'}<Icon style="font-size:1.6em" icon='mdi:reload' class="spin" />{/if}</div>
		<div class="flex-1 soft-title">{message?.data?.model ?? ''}</div>
	</div>

	<div class="flex-1 pl-12 relative overflow-hidden ">
	{#if message.images}
		{#each message.images as image, imageIdx}
			<img src={[image.header,image.base64].join(',')} alt="list" style="height:100px" />
		{/each}
	{/if}
		{#if message?.role == 'assistant'}
			{#if message.status == 'sent'}
				<Skeleton class="h-full" />
			{:else if ['streaming','done'].includes(message.status)}
				{@html assistantCode}
			{/if}	
		{:else if message?.role == 'user'}
			{@html message?.content}
		{/if}	 
	</div>
</div>

<style lang="postcss">
	.skeletonLine {
		@apply h-2 bg-gray-200 dark:bg-gray-600 rounded-md col-span-2 mb-1 animate-pulse;
	}
</style>
