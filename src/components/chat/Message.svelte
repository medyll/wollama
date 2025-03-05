<script lang="ts">
	import { Icon, Looper } from '@medyll/idae-slotui-svelte';
	import type { DBMessage } from '$types/db';

	import { marked } from 'marked';
	import Skeleton from '$components/fragments/Skeleton.svelte';
	import Prism from 'prismjs';
	import { tick } from 'svelte';
	import 'prismjs/themes/prism-tomorrow.css';
	import { idbQuery } from '$lib/db/dbQuery';

	interface MessageProps {
		messageId: string;
	}

	let { messageId }: MessageProps = $props();
	let message                     = $derived<DBMessage>(messageId ? idbQuery.getMessage(messageId) : ({} as DBMessage));

	let icon  = $derived(message?.role === 'user' ? 'lets-icons:user-scan-light' : 'icon-park:robot-one');
	let place = $derived(message?.role === 'user' ? 'mr-24' : 'ml-24');

	marked.use({
		async   : false,
		gfm     : true,
		pedantic: false
	});

	function wrap(el, wrapper) {
		if (el && el.parentNode) {
			el.parentNode.insertBefore(wrapper, el);
			wrapper.appendChild(el);
		}
	}

	function copyPaste() {
		navigator.clipboard.writeText('redddd').then(
			(success) => console.log('text copied'),
			(err) => console.log('error copying text')
		);
	}

	function selectCodeTags(textString: string) {
		if (!textString) return '';
		const parser     = new DOMParser();
		const htmlString = marked.parse(textString, { async: false }) as string;
		const doc        = parser.parseFromString(htmlString, 'text/html');

		const codeElements = doc.querySelectorAll('code');

		codeElements.forEach(async (codeElement) => {
			const lang = codeElement.classList?.[0] ? codeElement.classList[0].replace('language-', '').trim() : undefined;
			if (!lang) return;
			const wrapper = document.createElement('div');
			const toolbar = document.createElement('div');
			const pre     = document.createElement('pre');

			if (codeElement.parentElement?.tagName === 'PRE' && codeElement.parentElement.childNodes.length == 1) {
				codeElement.parentElement.replaceWith(codeElement);
			}
			wrapper.className = 'codeFormat';
			toolbar.className = 'flex items-center p-0.5';
			wrap(codeElement, wrapper);
			wrapper.insertBefore(toolbar, codeElement);
			wrap(codeElement, pre);
			toolbar.innerHTML        = `<div class="flex-1 p-1 soft-title">${lang}</div><div class="p-1"><button copyPaste >copy</button></div>`;
			codeElement.dataset.lang = lang;
			Prism.highlightElement(codeElement);
			await tick();
		});

		return doc.body.innerHTML;
	}

	let assistantCode = $derived.by(() => {
		if (message?.role === 'assistant' && message?.content && message?.content?.length) {
			return selectCodeTags(message?.content);
		}
	});

	let dd = $derived(message?.created_at?.getTime().toString());

	const messageRoleVariant = {
		'assistant': 'message-assistant',
		'user'     : 'message-user',
		'system'   : 'message-system',
		'tool'     : 'message-tool'
	};

</script>
<!-- {place} -->
<div class={`application-message    ${messageRoleVariant[message?.role]}`}>
	<!-- <div class="p-1">
			<div class="p-2 rounded-full shadow-md theme-border bg-gray-50/10">
					<Icon style="font-size:1.6em" {icon} />
			</div>
	</div> -->
	<!-- {#if message.role == 'user'}<div class="p-1">
					<div class="p-2 rounded-full shadow-md theme-border bg-gray-50/10">
							<Icon style="font-size:1.6em" {icon} />
					</div>
			</div>
	{/if} -->
	<div class="flex flex-col w-full">
		<div class="line-gap-2 mb-1 p-1 {message?.role == 'assistant' ? 'flex-row-reverse' : ''}">

			<div class="soft-title">
				{#if message?.status == 'streaming'}
					<Icon style="font-size:1.6em" icon="mdi:reload" class="spin" />
				{/if}
			</div>
			<!--  <div class="soft-title">{message?.model ?? ''}</div> format(new Date(message?.created_at), 'dd MMMM y hh:mm')-->
			<div class="flex-1"></div>
			<div class="soft-title">{message?.status != 'done' ? message?.status : ''}</div>
			<div class="soft-title">{message?.created_at}</div>
			<div class="p-2 rounded-full shadow-md theme-border bg-gray-50/10">
				<Icon {icon} style="font-size:1.6em" />
			</div>
		</div>
		<div class="speech-bubble theme-border preserve-line-breaks" style="user-select:text;">
			{#if message?.urls?.length}
				<Looper class="flex-h" data={message?.urls}>
					{#snippet children({ item })}
						<div>{item.title}</div>
					{/snippet}
				</Looper>
				<hr />
			{/if}
			{#if message?.images?.length}
				<img src={message?.images?.dataUri} alt="list" style="height:100px" />
			{/if}
			{#if message?.role === 'assistant'}
				{#if message?.status === 'idle'}
					<Skeleton class="h-full" />
				{:else if ['streaming', 'done'].includes(message.status)}
					<!-- {@html assistantCode} -->
					<div style="user-select: text;">{@html selectCodeTags(message?.content)}</div>
				{/if}
			{:else if message?.role == 'user'}
				{@html message?.content}
			{/if}
		</div>
	</div>
	<!-- {#if message.role == 'assistant'}<div class="p-1">
					<div class="p-2 rounded-full shadow-md theme-border bg-gray-50/10">
							<Icon style="font-size:1.6em" {icon} />
					</div>
			</div>
	{/if} -->
</div>

<style lang="postcss">
    @reference "../../styles/references.css";


    .message-assistant {
        @apply flex-row-reverse ;
				@variant 2xl {
						@apply basis-2/3 ml-0;
            @apply mt-16;
				}
    }

    .message-user {
        @apply flex-row ;
        @variant 2xl {
           @apply basis-1/3 mr-0;
        }
    }


    .preserve-line-breaks {
        white-space: pre-wrap;
    }

    .speech-bubble {
        @apply px-2 w-full   relative overflow-hidden  p-4 py-4 rounded-md;
        border: 1px solid var(--cfab-input-border-color) !important;
    }
</style>
