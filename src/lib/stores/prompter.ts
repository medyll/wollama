import type { MessageImageType, PromptType } from '$types/db';
import type { OllCompletionBody, OllOptionsType } from '$types/ollama';
import { get, writable } from 'svelte/store';
import { settings } from './settings';

export type PrompterType = {
    disabledPrompt: boolean;
    isPrompting: boolean;
    voiceListening: boolean;
    options: OllOptionsType;
    images?: MessageImageType;
    models: string[];
    promptData: PromptType;
    ollamaBody: Partial<OllCompletionBody>;
};

function prompterStore() {
    const defaultPromptState = {
        disabledPrompt: false,
        isPrompting: false,
        models: [get(settings).defaultModel],
        ollamaBody: {
            model: '',
            prompt: '',
            context: [],
            format: 'plain',
            images: [],
            options: { temperature: 0.5 },
            raw: false,
        } as Partial<OllCompletionBody>,
        options: { temperature: 0.5 },
        promptData: {},
        voiceListening: false,
    };
    const { subscribe, set, update } = writable<Partial<PrompterType>>(defaultPromptState);

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
        update,
    };
}

export const prompter = prompterStore();
