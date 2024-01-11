import type { MessageImageType, PromptType } from '$types/db';
import type { OllamaCompletionBody, OllamaOptionsType } from '$types/ollama';
import { get, writable } from 'svelte/store';
import { settings } from './settings';

export type PrompterType = {
	disabledPrompt: boolean;
	isPrompting: boolean;
	voiceListening: boolean;
	options: OllamaOptionsType;
	images?: MessageImageType;
	models: string[];
	promptData: PromptType;
	ollamaBody: OllamaCompletionBody;
};

function prompterStore() {
	const defaultPromptState = {
		disabledPrompt: false,
		isPrompting: false,
		models: [get(settings).defaultModel],
		ollamaBody: {
			context: [],
			format: 'plain',
			images: [],
			model: '',
			options: { temperature: 0.5 },
			prompt: ''
		} as OllamaCompletionBody,
		options: { temperature: 0.5 },
		promptData: {},
		voiceListening: false
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
		reset: () => {
			set(defaultPromptState);
		},
		set,
		subscribe,
		update
	};
}

export const prompter = prompterStore();
