// Type definitions for Ollama API

import {
  type Options,
  type GenerateRequest,
  type ChatRequest,
  type GenerateResponse,
  type ChatResponse,
} from "ollama/browser";

/* type OllamaType<T extends object> = typeof AbortableAsyncIterator<T>; */

export type WollamaResponse =
  | {
      generateResponse: GenerateResponse;
      type: "generate";
    }
  | {
      chatResponse: ChatResponse;
      type: "chat";
    };

/** @deprecated */
export enum OllamaFormatKeys {
  JSON = "json",
  PLAIN = "plain",
}
/** @deprecated */
export type OllamaFormat = keyof typeof OllamaFormatKeys | "" | string;

export enum OllamaChatMessageRole {
  USER = "user",
  SYSTEM = "system",
  ASSISTANT = "assistant",
}

/** @deprecated */
export interface OllApiGenerate extends Partial<GenerateRequest> {
  model: string;
  prompt: string;
  images: string[];
  format: OllamaFormat;
  system: string | undefined;
  template: string | undefined;
  context: number[];
  stream?: boolean;
  raw?: boolean;
  options: OllamaOptions;
}

/** @deprecated */
export interface OllamaChat extends Partial<ChatRequest> {
  model: string;
  messages: OllamaChatMessage[];
  format?: OllamaFormat;
  options: OllamaOptions;
  template?: string | undefined;
  stream?: boolean;
}
/** @deprecated */
export type OllamaChatMessage = {
  role: OllamaChatMessageRole;
  content: string;
  images?: string[];
};

/** @deprecated */
export type OllamaResponse = {
  model: string;
  create_at: string;
  response: string;
  done: boolean;
  context: number[];
  createdAt: string;
  eval_count: number;
  eval_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  total_duration: number;
  /** @deprecated*/ messageId: string;
  message: {
    role: string;
    content: string;
    images: string | null;
  };
};
/** @deprecated */
export interface OllamaOptions extends Partial<Options> {
  seed?: number;
  temperature?: number;
  repeat_penalty?: number;
  top_k?: number;
  top_p?: number;
  num_ctx?: number;
  mirostat?: number;
  mirostat_eta?: number;
  mirostat_tau?: number;
  num_gqa?: number;
  num_gpu?: number;
  num_thread?: number;
  repeat_last_n?: number;
  stop?: string[];
  tfs_z?: number;
  num_predict?: number;
}
