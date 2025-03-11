<script lang="ts">
	import { chatParametersState, type ChatParameters } from '$lib/states/chat.svelte';
	import { aiState } from '$lib/stores';
	import { connectionTimer } from '$lib/stores/timer.svelte';
	import { Icon } from '@medyll/idae-slotui-svelte';
	import ChatOptions from './ChatOptions.svelte';
	import Images from './input/Images.svelte';
	import Speech from './input/Speech.svelte';
	import TextArea from './input/TextArea.svelte';

	interface Props {
		submitHandler?:  (chatParams: ChatParameters) => void;
		keyPressHandler: (e: KeyboardEvent) => void;
        placeholder?: string;
	}

    let { submitHandler, keyPressHandler, placeholder }: Props = $props();
</script>

<div class="application-chat-zone">
	<Images />
	<div class="application-chat-room">
		<div class="absolute -top-10 left-0 flex w-full justify-center">
			<Speech
				onEnd={submitHandler}
				bind:prompt={chatParametersState.prompt}
				bind:voiceListening={chatParametersState.voiceListening}
			/>
		</div>
		<!-- <hr /> -->
		<div class="relative flex-1">
			<TextArea
				disabled={!connectionTimer.connected}
				onkeypress={keyPressHandler}
				bind:value={chatParametersState.prompt}
				bind:requestStop={$aiState}
				{placeholder}
				form="prompt-form"
			/>
			<div class="absolute right-3 top-[50%] -mt-5 flex h-10 w-10 flex-col place-content-center rounded-full">
				{#if $aiState == 'done'}
					<button class="input aspect-square items-center rounded-full drop-shadow-lg" type="submit" form="prompt-form">
						<Icon icon="mdi:send" />
					</button>
				{:else}
					<button
						class="flex aspect-square place-content-center rounded-full border border drop-shadow-lg"
						form="prompt-form"
					>
						<Icon icon="mdi:stop" />
					</button>
				{/if}
			</div>
			<!-- <hr /> -->
		</div>
		<div class="flex">
			<ChatOptions />
			<div class="flex-1"></div>
		</div>
	</div>
</div>
