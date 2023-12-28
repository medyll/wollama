import type { MessageImageType } from '$types/db';
import type { OllamaApiBody, OllamaOptionsType } from '$types/ollama';
import { writable } from 'svelte/store';

export type PrompterType = {
	disabledPrompt: boolean;
	isPrompting: boolean;
	voiceListening: boolean;
	options: OllamaOptionsType;
	images?: MessageImageType;
	format: 'json' | 'plain';
	ollamaBody: OllamaApiBody;
};

function prompterStore() {
	const { subscribe, set, update } = writable<PrompterType>({
		voiceListening: false,
		isPrompting: false,
		disabledPrompt: false,
		options: { temperature: 0.5 },
		format: 'plain', /** @deprecated */
		ollamaBody: {
			prompt: '',
			model: '',
			context: [],
			options: {},
			images: [],
			format: 'plain',
			
		} as OllamaApiBody
	});

	let promptTimer: NodeJS.Timeout;

	subscribe((o) => {
		if (o.isPrompting) {
			clearTimeout(promptTimer);
			promptTimer = setTimeout(() => {
				update((n) => {
					return { ...n, isPrompting: false };
				});
			}, 500);
		}
	});

	return {
		subscribe,
		set,
		update,
		reset: () => {
			update((n: PrompterType) => {
				return {
					...n,
					images: undefined,
					voiceListening: false,
					isPrompting: false,
					disabledPrompt: false,
					format: 'plain',
					ollamaBody: {
						prompt: '',
						model: '',
						context: [],
						options: {},
						images: [],
						format: 'plain'
					} as OllamaApiBody
				};
			});
		}
	};
}

export const prompter = prompterStore();
