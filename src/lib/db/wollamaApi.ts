import type { WollamaResponse } from "$types/ollama";
import ollama, {
  type Config,
  type GenerateRequest,
  type GenerateResponse,
  type ChatRequest,
  type ChatResponse,
  type PushRequest,
  type CreateRequest,
} from "ollama/browser";

interface Hook {
  messageId: string;
  message: {
    role: string;
    content: string;
    images: string | null;
  };
}

export interface GenerateResponseHook extends GenerateResponse, Hook {}

class WollamaApiConfig {
  model: string = "llama2";
  host: string = "http://127.0.0.1:11434";
  headers?: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  setOptions(
    options: Config & {
      model?: string;
    }
  ) {
    if (options.model) this.model = options.model;
    if (options.host) this.host = options.host;
    if (options.headers) this.headers = options.headers;
  }
}

export const wollamaApiConfig = new WollamaApiConfig();
export type GgenerateRequestStream = GenerateRequest & {
  stream: true;
};
export type GenerateRequestNoStream = GenerateRequest & {
  stream: false;
};

export class ApiEvent {
  #onStream!: (data: GenerateResponseHook) => void;
  #onEnd!: (data: GenerateResponseHook) => void;
  #onData: (data: GenerateResponseHook) => void;

  constructor() {
    this.#onStream = (data: GenerateResponseHook) => {};
    this.#onEnd = (data: GenerateResponseHook) => {};
    this.#onData = (data: GenerateResponseHook) => {};

    return this;
  }

  static eventApi() {
    return new ApiEvent();
  }

  set onStream(callback: (data: GenerateResponseHook) => void) {
    this.#onStream = callback;
  }
  set onEnd(callback: (data: GenerateResponseHook) => void) {
    this.#onEnd = callback;
  }

  set onData(callback: (data: GenerateResponseHook) => void) {
    this.#onData = callback;
  }

  get onData() {
    return this.#onData;
  }

  get onStream() {
    return this.#onStream;
  }
  get onEnd() {
    return this.#onEnd;
  }
}
export class WollamaApiCore {
  onStream!: (data: GenerateResponseHook) => void;
  onEnd!: (data: GenerateResponseHook) => void;
  /**
   * Send chat request using the Ollama generate API.
   * @param generateRequest The generate request object.
   * @param hook An optional callback function to handle the response data.
   * @returns The generated data or the response object if the request fails.
   */
  async generate(
    generateRequest: GenerateRequest,
    hook?: (data: GenerateResponseHook) => void
  ) {
    let response;

    if (generateRequest.stream) {
      response = await ollama.generate({
        ...generateRequest,
        stream: true,
      });

      console.log({ response });
      await this.stream(response, hook, "generate");
      //
    } else {
      response = await ollama.generate({
        ...generateRequest,
        stream: false,
      });
    }

    return response;
  }

  generate_bis(request: GenerateRequest): ApiEvent {
    const event = ApiEvent.eventApi();

    let response;

    if (request.stream) {
      response = ollama
        .generate({
          ...request,
          stream: true,
        })
        .then((response) => {
          this.stream(response, event.onStream, "generate");
        });
    } else {
      response = ollama
        .generate({
          ...request,
          stream: false,
        })
        .then((response) => response);
    }

    return event;
  }

  /**
   * Handles a chat request and returns an event.
   *
   * @param {ChatRequest} request - The chat request object containing the necessary parameters.
   * @returns {Promise<ApiEvent>} - A promise that resolves to an ApiEvent.
   *
   * The function checks if the request should be streamed. If `request.stream` is true,
   * it initiates a streaming chat and processes the response using the `stream` method.
   * Otherwise, it performs a non-streaming chat request.
   */
  async chat(request: ChatRequest) {
    const event = ApiEvent.eventApi();

    let response;

    if (request.stream) {
      response = await ollama.chat({
        ...request,
        stream: true,
      });
      this.stream(response, event.onStream, "chat");
    } else {
      response = await ollama.chat({
        ...request,
        stream: false,
      });
    }

    return event;
  }

  async stream<T>(
    response: AsyncIterator<T>,
    hook?: (data: OllamaResponse) => void,
    type: "generate" | "chat"
  ) {
    for await (const part of response) {
      if (hook) hook(part);
    }
  }

  async pull(model: string, hook: (args: any) => void) {
    const response = await ollama.pull({ model, stream: true });
    for await (const part of response) {
      hook(part);
    }
  }

  async push(push: PushRequest, hook: (args: any) => void) {
    const response = await ollama.push({ ...push, stream: true });
    for await (const part of response) {
      hook(part);
    }
  }

  async create(create: CreateRequest, hook: (args: any) => void) {
    const response = await ollama.create({ ...create, stream: true });
    for await (const part of response) {
      hook(part);
    }
  }

  async delete(model: string) {
    return ollama.delete({ model });
  }

  async tags(cb?: (data: any) => void): Promise<any> {
    const response = await ollama.list();
    if (cb) cb(response);
    return response;
  }

  async ping(url: string) {
    // Assuming the official API has a similar endpoint
    const response = await fetch(`${url}/api/tags/`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "GET",
    });
    if (!response.ok) throw await response.json();
    return await response.json();
  }
}

export const WollamaApi = new WollamaApiCore();
