import type { DBMessage, MessageImageType, PromptType } from "$types/db";
import type {
  OllApiGenerate,
  OllamaChat,
  OllamaChatMessage,
} from "$types/ollama";

export type ChatGenerate = {
  disabledPrompt: boolean;
  isPrompting: boolean;
  voiceListening: boolean;
  images?: MessageImageType;
  models: string[];
  promptSystem: PromptType;
  prompt: string;
  temperature: number;
  format?: "json" | "plain";
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

let chatParamsB = createChatParams();
export let chatParamsState = chatParamsB.chatParams;

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
    model: chatParamsState?.models?.[0] ?? "",
    system: chatParamsState.promptSystem?.id,
    format: chatParamsState.format?.replace("plain", ""),
    images: chatParamsState.images?.base64
      ? [chatParamsState.images?.base64]
      : undefined,
    messages: chatSession.messages,
    options: {
      temperature: chatParamsState.temperature,
    },
  });
  return derive;
};

export let chatGenerated = (): OllApiGenerate => {
  let derive = $derived({
    model: chatParamsState.models[0],
    prompt: chatParamsState.prompt,
    system: chatParamsState.promptSystem?.id,
    format: chatParamsState.format?.replace("plain", ""),
    images: chatParamsState.images?.base64
      ? [chatParamsState.images?.base64]
      : undefined,
    template: chatParamsState.template,
    context: chatSession.context,
    options: {
      temperature: chatParamsState.temperature,
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
    prompt: "",
    template: "",
  });

  return {
    get chatParams() {
      return _chatParams;
    },
  };
}
