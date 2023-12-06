<script lang="ts">
	import InputZone from '$lib/components/Speech.svelte';
	import MessageList from '$lib/components/MessageList.svelte';
	import Model from '$lib/components/Model.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import { sendPrompt } from '$lib/promptSender';
	import { createMessage } from '$lib/tools/askOllama';
	import { messageList } from '../stores/messages';

	let submitPrompt: Function;

	let voiceListening = false;

	let prompt: string = '';
	let streamResponseText: string = '';

	/* if (Object.values($messageList.length).length > 1) {
		// window.history.replaceState(history.state, '', `/c/activeChat/activeChat`); 
	} */

	function sendRequest(content: string) {
		// build message
		const message = createMessage({ role: 'user', content });
		const messageAssistant = createMessage({ role: 'assistant', parentId: message.id });

		// add message to list
		messageList.update((n) => ({
			...n,
			[message.id]: message,
			[messageAssistant.id]: messageAssistant
		}));

		// send prompt
		sendPrompt(content, (content) => {
			streamResponseText += content;
			const newcont = $messageList[messageAssistant.id];
			messageList.update((n) => ({
				...n,
				[messageAssistant.id]: { ...newcont, content: streamResponseText }
			}));
		});
	}
</script>

<div class="flex flex-col h-full w-full overflow-auto relative">
	<Model />
	<div class="flex-1 mb-32">
		<MessageList />
	</div>
	<div class="w-full y-b fixed  margb-0 max-w-3xl bottom-0">
		<form
			id="prompt-form"
			on:submit|preventDefault={() => {
				submitPrompt(prompt);
			}}
		/>
		<div class="flex place-items-center rounded-xl dark:bg-gray-800 dark:border-gray-100 dark:text-gray-100">
			<textarea
				class="flex-1 border dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 outline-none py-3 px-2 resize-none"
				placeholder={voiceListening ? 'Listening...' : 'Write a message'}
				disabled={voiceListening}
				bind:value={prompt}
				on:keypress={(e) => {
					if (e.key === 'Enter'  && !e.shiftKey ) {
						e.preventDefault()
						sendRequest(prompt);
					}
				}}
				rows="1"
				form="prompt-form"
			/>
			<div  >
				<InputZone onEnd={sendRequest} bind:prompt bind:voiceListening />
			</div>
		</div>
		<div class="text-xs  text-center">Caution message</div>
	</div>
</div>
