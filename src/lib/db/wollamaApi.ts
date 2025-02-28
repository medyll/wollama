import type { WollamaResponse } from "$types/ollama";
import ollama, {
  type Options,
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

interface GenerateResponseHook extends GenerateResponse, Hook {}

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

export class WollamaApiCore {
  /**
   * Send chat request using the Ollama generate API.
   * @param generateRequest The generate request object.
   * @param hook An optional callback function to handle the response data.
   * @returns The generated data or the response object if the request fails.
   */
  async generate(
    generateRequest: GenerateRequest & {
      stream: true;
    },
    hook?: (data: GenerateResponseHook) => void
  ) {
    const response = await ollama.generate(generateRequest).then((res) => {
      console.log({ res });
      return res;
    });
    const wollamaResponse: WollamaResponse = {
      generateResponse: response,
      chatResponse: null,
      type: "generate",
    };
    if (generateRequest.stream) {
      console.log({ response });
      // this.stream(response, hook);

      /* for await (const part of response) {
        console.log({ part });
        if (hook) {
          hook({
            ...part,
            messageId: "",
            message: { role: "", content: part.response, images: null },
          });
        }
      } */
      /*  this.stream(response, hook); */
      /*  for await (const part of response) {
        if (hook) {
          hook({
            ...part,
            messageId: "",
            message: { role: "", content: "", images: null },
          });
        }
      } */
    } else {
      return response;
    }
  }

  /**
   * Sends a chat request using the chat API.
   *
   * @param chatRequest - The chat request object.
   * @param hook - Optional callback function to handle the response data.
   * @returns A Promise that resolves to the response data from the Ollama API.
   */
  async chat(
    chatRequest: ChatRequest & {
      stream: true;
    },
    hook?: (data: ChatResponse & Hook) => void
  ) {
    const response = await ollama.chat(chatRequest);
    if (chatRequest.stream) {
      console.log({ response });
      this.stream(response, hook);
      /* for await (const part of response) {
        if (hook)
          hook({
            ...part,
            messageId: "",
            message: { role: "", content: "", images: [] },
          });
      } */
    } else {
      return response;
    }
  }

  async stream(response: Response, hook?: (data: OllamaResponse) => void) {
    //if (response?.body && response?.ok) {
    for await (const part of response) {
      if (hook)
        hook({
          ...part,
          messageId: "",
          message: { role: "", content: "", images: [] },
        });
    }
    /*  const streamReader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(this.splitStream("\n"))
        .getReader();

      while (true) {
        const { value, done } = await streamReader.read();

        if (Boolean(done) || this.requestStop) break;
        if (value) {
          const data: OllamaResponse = JSON.parse(value);

          if (hook) hook(data);
        }
      } */
    // }
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

/* class OllamaApiFetch {
  config = wollamaApiConfig;
  requestStop = false;

  constructor() {}

  fetch = async (
    method: "GET" | "POST" | "DELETE",
    url: string,
    body?: string
  ): Promise<any> => {
    let headers: RequestInit["headers"] = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    return fetch(`${this.config.host}/${url}`, {
      headers,
      method,
      body,
    })
      .then(async (res) => {
        if (!res?.ok) throw await res.json(); 
        return res.body instanceof ReadableStream ? res : await res.json();
      })
      .then(async (res) => {
        return res;
      })
      .catch((error) => {
        throw new Error("{ failed: true }");
      });
  };

  async stream(response: Response, hook?: (data: OllamaResponse) => void) {
    if (response?.body && response?.ok) {
      const streamReader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(this.splitStream("\n"))
        .getReader();

      while (true) {
        const { value, done } = await streamReader.read();

        if (Boolean(done) || this.requestStop) break;
        if (value) {
          const data: OllamaResponse = JSON.parse(value);

          if (hook) hook(data);
        }
      }
    }
  }
  private splitStream(separator: string) {
    let buffer = "";
    return new TransformStream({
      flush(controller) {
        if (buffer) controller.enqueue(buffer);
      },
      transform(chunk, controller) {
        buffer += chunk;
        const parts = buffer.split(separator);
        parts.slice(0, -1).forEach((part) => controller.enqueue(part));
        buffer = parts[parts.length - 1];
      },
    });
  }
} */

export const WollamaApi = new WollamaApiCore();
