import type { MessageImageType, PromptType } from '$types/db';
import type { OllApiChat, OllApiGenerate, OllOptionsType } from '$types/ollama';
import { get, writable } from 'svelte/store';
import { settings } from './settings';

export type PrompterType = {
    disabledPrompt: boolean;
    isPrompting: boolean;
    voiceListening: boolean;
    images?: MessageImageType;
    models: string[];
    promptSystem: PromptType;
    ollamaPayload: Partial<OllApiChat>;
    //
    prompt: string;
} & Partial<OllApiChat>;

function prompterStore() {
    const defaultPromptState = {
        disabledPrompt: false,
        isPrompting: false,
        models: [get(settings).defaultModel],
        prompt: '',
        ollamaPayload: {
            model: '',
            context: [],
            format: 'plain',
            images: [],
            options: { temperature: 0.5 },
            raw: false,
        } as Partial<OllApiChat>,
        promptSystem: {} as PromptType,
        voiceListening: false,
    } satisfies PrompterType;
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
        update,
    };
}

export const prompter = prompterStore();
