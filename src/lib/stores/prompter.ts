import type { MessageImageType, PromptType } from "$types/db";
import type { OllamaChat } from "$types/ollama";
import { type Options } from "ollama/browser";
import { derived, get, writable } from "svelte/store";
import { settings } from "$lib/stores/settings.svelte";
import { ollamaApiMainOptionsParams } from "$lib/stores/ollamaParams";

export type PrompterType = {
  disabledPrompt: boolean;
  isPrompting: boolean;
  voiceListening: boolean;
  images?: MessageImageType;
  models: string[];
  promptSystem: PromptType;
  prompt: string;
};

function PAYLOAD() {
  const apiChatStore = writable<OllamaChat>({} as OllamaChat);

  return {
    set: apiChatStore.set,
    setValue: (key: keyof OllamaChat, value: any) => {
      apiChatStore.update((n) => {
        const newSettings = { ...n, [key]: value };
        return newSettings;
      });
    },
    subscribe: apiChatStore.subscribe,
  };
}

export const ollamaPayloadStore = PAYLOAD();

function PAYLOAD_OPTIONS() {
  const optionsStore = writable<Options>({ temperature: 0.5 });

  return {
    set: optionsStore.set,
    setValue: (key: keyof Options, value: any) => {
      optionsStore.update((n) => {
        const newSettings = { ...n, [key]: value };
        return newSettings;
      });
    },
    subscribe: optionsStore.subscribe,
  };
}

export const ollamaPayloadOptions = PAYLOAD_OPTIONS();

function prompterStore() {
  const defaultPromptState = {
    disabledPrompt: false,
    isPrompting: false,
    models: [get(settings).defaultModel],
    prompt: "",
    images: undefined,
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

export const ollamaBodyStore = derived(
  [
    prompter,
    ollamaPayloadStore,
    ollamaPayloadOptions,
    ollamaApiMainOptionsParams,
  ],
  ([
    $prompter,
    $ollamaPayloadStore,
    $ollamaPayloadOptions,
    $ollamaApiMainOptionsParams,
  ]) => {
    return {
      ...$ollamaPayloadStore,
      format: $ollamaPayloadStore.format?.replace("plain", ""),
      images: $prompter.images?.base64 ? [$prompter.images?.base64] : undefined,
      options: { ...$ollamaApiMainOptionsParams, ...$ollamaPayloadOptions },
    };
  }
);
