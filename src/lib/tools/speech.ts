import { browser } from '$app/environment';

export interface RecognitionHandler {
	fn: (args: SpeechReturn) => SpeechReturn;
}

export interface SpeechReturn {
	speechEvent?: 'onresult' | 'onend' | 'onerror'; // Specifies the type of speech recognition event.
	results?:     SpeechRecognitionResultList; // Contains the list of speech recognition results.
	message?:     string; // Specifies an error message for speech recognition errors.
	transcript?:  string; // Contains the transcribed speech.
	bribe?:       string; // Contains the last captured speech.
}

export type DefaultOptions = {
	autoStart?:  boolean; // Specifies whether speech recognition should automatically start.
	continuous?: boolean; // Specifies whether speech recognition should continue listening after each recognition result.
	lang?:       string; // Specifies the language for speech recognition.
	stopDelay?:  number; // Specifies the time to wait before stopping speech recognition after the last recognition result.
	stopOnWord?: string; // Specifies the word to stop speech recognition on.
};

const defaultOptions = {
	autoStart:  true,
	continuous: true,
	lang:       'fr-FR',
	stopDelay:  4,
	stopOnWord: 'Stop.'
};

const speechRecognition = browser
	? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
	: () => {};

export const speechRecognitionTracker = {
	isListening: false
};

/**
 * Handles speech recognition and provides a speech recognition API.
 * @param speechHandler - The callback function to handle speech recognition events.
 * @param options - The options for speech recognition.
 * @returns An object with methods to start and stop speech recognition.
 */
export const speechRecognitionHandler = (
	speechHandler: (args: SpeechReturn) => void,
	options: DefaultOptions = defaultOptions
) => {
	let waiterTimer: any;
	const speechOptions = { ...defaultOptions, ...options };

	if (speechRecognition) {
		handler();
	} else {
		speechHandler({
			message:     'SpeechRecognition is not supported.',
			speechEvent: 'onerror'
		});
	}

	function handler() {
		let full_transcript: any = '';

		speechRecognition.continuous = speechOptions.continuous;
		speechRecognition.lang = speechOptions.lang;

		if (options?.autoStart) listen();

		speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
			const transcript = Object.values(event.results).at(-1)?.[0].transcript;
			speechHandler({ bribe: transcript, results: event.results, speechEvent: 'onresult' });

			full_transcript = full_transcript + transcript;
			speechRecognitionTracker.isListening = false;

			if (transcript?.includes('Stop.')) speechRecognition.stop();
			waitEnd();
		};

		speechRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			speechHandler({ message: `Voice recognition error: ${event.error}`, speechEvent: 'onerror' });
		};

		speechRecognition.onend = (event: Event) => {
			speechRecognitionTracker.isListening = false;
			speechHandler({ speechEvent: 'onend', transcript: full_transcript });
		};
	}

	function waitEnd() {
		clearTimeout(waiterTimer);
		waiterTimer = setTimeout(() => {
			stop();
		}, speechOptions.stopDelay * 1000);
	}
	function listen() {
		speechRecognitionTracker.isListening = true;
		speechRecognition.start();
	}

	function stop() {
		speechRecognitionTracker.isListening = false;
		speechRecognition.stop();
	}

	return {
		listen,
		stop
	};
};
