import { type OllamaChat, type OllApiGenerate, type OllamaResponse, type OllamaPush, type OllamaCreate } from '$types/ollama';

class OllamaApiConfig {
    model: string = 'llama2';
    ollama_endpoint: string = 'http://127.0.0.1:11434';
    headers: Record<string, string> | undefined = undefined;

    setOptions(options: { model?: string; ollama_endpoint?: string; headers?: Record<string, string> | undefined }) {
        if (options.model) this.model = options.model;
        if (options.ollama_endpoint) this.ollama_endpoint = options.ollama_endpoint;
        if (options.headers) this.headers = options.headers;
    }
}

export const ollamaApiConfig = new OllamaApiConfig();

export class OllamaApiCore {
    private config: OllamaApiConfig;
    constructor() {
        this.config = new OllamaApiConfig();
    }

    /**
     * Send chat request using the Ollama generate API.
     * @param generateRequest The generate request object.
     * @param hook An optional callback function to handle the response data.
     * @returns The generated data or the response object if the request fails.
     */
    async generate(generateRequest: OllApiGenerate, hook?: (data: OllamaResponse) => void) {
        const ollamaFetch = new OllamaApiFetch();
        const res = await ollamaFetch.fetch('POST', `api/generate`, JSON.stringify(generateRequest));

        if (res.ok) {
            if (generateRequest?.stream) {
                ollamaFetch.stream(res, hook);
            } else {
                const out = await res.json();

                return out;
            }
        }

        return res;
    }

    /**
     * Sends a chat request using the chat API.
     *
     * @param chatRequest - The chat request object.
     * @param hook - Optional callback function to handle the response data.
     * @returns A Promise that resolves to the response data from the Ollama API.
     */
    async chat(chatRequest: OllamaChat, hook?: (data: OllamaResponse) => void) {
        const ollamaFetch = new OllamaApiFetch();

        const res = await ollamaFetch.fetch('POST', `api/chat`, JSON.stringify(chatRequest));

        if (res.ok) {
            if (chatRequest?.stream) {
                ollamaFetch.stream(res, hook);
            } else {
                const out = await res.json();

                return out;
            }
        }
        return res;
    }

    async ping(url: string) {
        return fetch(`${url}/api/tags/`, {
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'GET',
        })
            .then(async (res) => {
                if (!res?.ok) throw await res.json();
                return await res.json();
            })
            .then(async (res) => {
                return res?.models;
            })
            .catch((error) => {
                throw error;
            });
    }

    async tags(cb?: (data: any) => {}): Promise<any> {
        try {
            const ollamaFetch = new OllamaApiFetch();
            const res = await ollamaFetch.fetch('GET', `api/tags`);
            if (res.body instanceof ReadableStream) {
                let dta: any[] = [];
                await ollamaFetch.stream(res, (data: any) => {
                    dta = data;
                    if (cb) cb(dta);
                });
                if (cb) cb(dta);
                return dta;
            }
            return res;
        } catch (e) {
            console.error(e);
            throw new Error('Failed to fetch models');
        }
    }

    /** Get the list of models from the Ollama API. */
    async delete(model: string) {
        const ollamaFetch = new OllamaApiFetch();
        return ollamaFetch.fetch('DELETE', `api/delete`, JSON.stringify({ name: model }));
    }

    async create(create: OllamaCreate, hook: (args: any) => void) {
        const ollamaFetch = new OllamaApiFetch();
        const res = await ollamaFetch.fetch('POST', `api/pull`, JSON.stringify(create));
        ollamaFetch.stream(res, hook);
    }

    async pull(model: string, hook: (args: any) => void) {
        const ollamaFetch = new OllamaApiFetch();
        const res = await ollamaFetch.fetch('POST', `api/pull`, JSON.stringify({ name: model }));
        ollamaFetch.stream(res, hook);
    }

    async push(push: OllamaPush, hook: (args: any) => void) {
        const ollamaFetch = new OllamaApiFetch();
        const res = await ollamaFetch.fetch('POST', `api/pull`, JSON.stringify(push));
        ollamaFetch.stream(res, hook);
    }
}

export const OllamaApi = new OllamaApiCore();
class OllamaApiFetch {
    config = ollamaApiConfig;
    requestStop = false;

    constructor() {}

    fetch = async (method: 'GET' | 'POST' | 'DELETE', url: string, body?: string): Promise<any> => {
        let headers: RequestInit['headers'] = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        return fetch(`${this.config.ollama_endpoint}/${url}`, {
            headers,
            method,
            body,
        })
            .then(async (res) => {
                if (!res?.ok) throw await res.json();
                // const contentType = res.headers.get('Content-Type');

                // return contentType?.includes('stream') ? res : await res.json();
                return res.body instanceof ReadableStream ? res : await res.json();
            })
            .then(async (res) => {
                return res;
            })
            .catch((error) => {
                throw new Error('{ failed: true }');
            });
    };

    async stream(response: Response, hook?: (data: OllamaResponse) => void) {
        if (response?.body && response?.ok) {
            const streamReader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(this.splitStream('\n')).getReader();

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
        let buffer = '';
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
}
