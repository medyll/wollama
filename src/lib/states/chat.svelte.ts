import type { DBMessage, MessageImageType, PromptType } from '$types/db';
import type { OllApiGenerate, OllamaChat, OllamaChatMessage } from '$types/ollama';

type ChatGenerate = {
    disabledPrompt: boolean;
    isPrompting: boolean;
    voiceListening: boolean;
    images?: MessageImageType;
    models: string[];
    promptSystem: PromptType;
    prompt: string;
    temperature: number;
    format?: 'json' | 'plain';
    template: string;
};

type ChatSession = {
    chatId: string | undefined;
    messages: OllamaChatMessage[];
    context: number[];
};
export let chatSession: ChatSession = $state({
    chatId: undefined,
    messages: [],
    context: [],
});

let chatParamsState = createChatParams();
export let chatParams = chatParamsState.chatParams;

/* export let chatParams: ChatGenerate = $state({
    disabledPrompt: false,
    isPrompting: false,
    images: undefined,
    promptSystem: {} as PromptType,
    voiceListening: false,
    temperature: 0.5,
    format: undefined,
    models: [],
    prompt: '',
    template: '',
}); */

export let chatChat = (): OllamaChat => {
    let derive = $derived({
        model: chatParams?.models?.[0] ?? '',
        system: chatParams.promptSystem?.id,
        format: chatParams.format?.replace('plain', ''),
        images: chatParams.images?.base64 ? [chatParams.images?.base64] : undefined,
        messages: chatSession.messages,
        options: {
            temperature: chatParams.temperature,
        },
    });
    return derive;
};

export let chatGenerated = (): OllApiGenerate => {
    let derive = $derived({
        model: chatParams.models[0],
        prompt: chatParams.prompt,
        system: chatParams.promptSystem?.id,
        format: chatParams.format?.replace('plain', ''),
        images: chatParams.images?.base64 ? [chatParams.images?.base64] : undefined,
        template: chatParams.template,
        context: chatSession.context,
        options: {
            temperature: chatParams.temperature,
        },
    });

    return derive as OllApiGenerate;
};

export function createChatParams() {
    let _chatParams = $state<ChatGenerate>({
        disabledPrompt: false,
        isPrompting: false,
        images: undefined,
        promptSystem: {} as PromptType,
        voiceListening: false,
        temperature: 0.5,
        format: undefined,
        models: [],
        prompt: '',
        template: '',
    });

    return {
        get chatParams() {
            return _chatParams;
        },
    };
}
