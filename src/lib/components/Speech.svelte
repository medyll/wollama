<script lang="ts">
	import { speechRecognitionHandler, type SpeechReturn } from '$lib/speechHandler';
	import { ui } from '$lib/stores/ui';
	import Icon from '@iconify/svelte';
	import toast from 'svelte-french-toast';

	export let voiceListening = false;
	export let transcript: string = '';
	export let bribe: string = '';
	export let onEnd: (transcript: string) => void = () => null;

	export let prompt: string = '';
	export let disabled: boolean = false;

	const stopResponse = () => {
		$ui.stopSystemResponse = true;
	};

	let voiceRecognition = speechRecognitionHandler(speechListener, { autoStart: false });

	function speechListener(args: SpeechReturn) {
		switch (args.speechEvent) {
			case 'onresult':
				bribe += args.bribe ?? '';
				prompt = bribe;
				break;
			case 'onend':
				onEnd(args.transcript || '');
				transcript = args.transcript || '';
				voiceListening = false;
				break;
			case 'onerror':
				voiceListening = false;
				toast.error(`Speech recognition error: ${args.message}`);
				break;
			default:
				break;
		}
	}
</script>

<div class="place-items-center">
	<button
		type="button"
		{disabled}
		on:click={() => {
			if (!voiceListening) {
				stopResponse();
				voiceListening = true;
				voiceRecognition.listen();
			}else{
				stopResponse();
			}
		}}
	>
		<Icon   icon={ voiceListening? 'ooui:ellipsis':'mdi:microphone'}
		style="font-size:1.8em" />
	</button>  
</div>
