import { writable } from 'svelte/store';

export type PrompterType = {
	prompt: string;
    disabledPrompt: boolean;
	isPrompting: boolean;
	temperature: number;
	voiceListening: boolean;
};

function prompterStore() {
	const { subscribe, set, update } = writable<PrompterType>({
		prompt: '',
		temperature: 0.5,
		voiceListening: false,
		isPrompting: false,
        disabledPrompt: false
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
		update
	};
}

export const prompter = prompterStore();