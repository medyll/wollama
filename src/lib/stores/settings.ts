import { writable } from 'svelte/store';

export interface Settings {
	speechAutoSend?: boolean;
	speechRecognition?: SpeechRecognition;
	system: string;
	requestFormat?: string;
	API_BASE_URL?: string;
	modelList?: string[];
	llamaOptions?: {
		seed?: string;
		temperature?: number;
		repeat_penalty?: number;
		top_k?: number;
		top_p?: number;
		num_ctx?: number;
	};
}

export const settings = writable<Settings>({});
