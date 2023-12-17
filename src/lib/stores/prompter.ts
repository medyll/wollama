import type { MessageImageType } from '$types/db';
import type { OllamaOptionsType } from '$types/ollama'; 
import { writable } from 'svelte/store';
 

export type PrompterType = {
	prompt: string;
    disabledPrompt: boolean;
	isPrompting: boolean;
	temperature: number; /** @deprecated */
	voiceListening: boolean;
	options: OllamaOptionsType;
	images?: MessageImageType[]; 
};

function prompterStore() {
	const { subscribe, set, update } = writable<PrompterType>({
		prompt: '',
		temperature: 0.5,
		voiceListening: false,
		isPrompting: false,
        disabledPrompt: false,
		options: {}
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
			update((n) => {
				return {
					...n,
					prompt: '',
					images: [],
					voiceListening: false,
					isPrompting: false,
					disabledPrompt: false,
				};
			});
		}
	};
}

export const prompter = prompterStore();
