import type { MessageImageType } from '$types/db';
import type { OllamaApiBody, OllamaOptionsType } from '$types/ollama';
import { get, writable } from 'svelte/store';
import { settings } from './settings';

export type PrompterType = {
	disabledPrompt: boolean;
	isPrompting: boolean;
	voiceListening: boolean;
	options: OllamaOptionsType;
	images?: MessageImageType;
	models: string[];
	ollamaBody: OllamaApiBody;
};

function prompterStore() {
	const defaultPromptState = {
		voiceListening: false,
		isPrompting: false,
		disabledPrompt: false,
		options: { temperature: 0.5 },
		models: [get(settings).defaultModel],
		ollamaBody: {
			prompt: '',
			model: '',
			context: [],
			options: {},
			images: [],
			format: 'plain'
		} as OllamaApiBody
	};
	const { subscribe, set, update } = writable<PrompterType>(defaultPromptState);

	let promptTimer: NodeJS.Timeout;

	subscribe((o) => {
		if (o.isPrompting) {
			clearTimeout(promptTimer);
			promptTimer = setTimeout(() => {
				update((n) => {
					return { ...n, isPrompting: false };
				});
			}, 100);
		}
	});

	return {
		subscribe,
		set,
		update,
		reset: () => {
			set(defaultPromptState);
		}
	};
}

export const prompter = prompterStore();
