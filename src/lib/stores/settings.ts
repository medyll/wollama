import { writable } from 'svelte/store';
import { defaultOllamaSettings, defaultOptions } from '../../configuration/configuration';

export interface Settings {
	theme?: string;
	requestFormat?: string;
	ollama_server?: string;
	models?: string[];
	defaultModels?: string[];
	chatModelKeys?: string[];
	defaultModel?: string;
	auth: string;
	system_prompt?: string;
	sender: {
		speechAutoSend?: boolean;
		speechRecognition?: SpeechRecognition;
		system?: string;
	};
	llamaOptions?: {
		seed?: string;
		temperature?: number;
		repeat_penalty?: number;
		top_k?: number;
		top_p?: number;
		num_ctx?: number;
	};
}

const settingStore = () => {
	const isBrowser = typeof window !== 'undefined';
	const { subscribe, set, update } = writable<Settings>({
		...defaultOptions,
		llamaOptions: defaultOllamaSettings
	});

	let currentStore = {} as Settings;
	let dataStoreTimer: NodeJS.Timeout;

	subscribe((o) => {
		currentStore = o;
		storeData();
	});

	function storeData() {
		clearTimeout(dataStoreTimer);
		dataStoreTimer = setTimeout(() => {
			localStorage.settings = JSON.stringify(currentStore);
		}, 500);
	}

	isBrowser && localStorage.settings && set(JSON.parse(localStorage.settings));

	function setParameterValue(key: string, value: any) {
		update((n) => {
			const newSettings = { ...n, [key]: value };
			return newSettings;
		});
	}

	return {
		subscribe,
		set,
		update,
		setParameterValue
	};
};

export const settings = settingStore();

export const showSettings = writable<boolean>(false);
