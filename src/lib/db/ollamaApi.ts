import { aiState } from '$lib/stores';
import { type OllamaChat, type OllApiGenerate, type OllamaResponse } from '$types/ollama';
import { get } from 'svelte/store';

class OllamaConfig {
    options: {
        model: string;
        ollama_endpoint: string;
        headers: Record<string, string> | undefined;
    } = {
        model: 'llama2-uncensored',
        ollama_endpoint: 'http://localhost:11434',
        headers: undefined,
    };

    setOptions(options: OllamaConfig['options']) {
        this.options = { ...this.options, ...options };
    }

    setHeaders(headers: Record<string, string>) {
        this.options.headers = { ...(this.options.headers || {}), ...headers };
    }
}

export const ollamaConfig = new OllamaConfig();

export class OllamaApi {
    /**
     * Send chat request using the Ollama generate API.
     * @param generateRequest The generate request object.
     * @param hook An optional callback function to handle the response data.
     * @returns The generated data or the response object if the request fails.
     */
    static async generate(generateRequest: OllApiGenerate, hook?: (data: OllamaResponse) => void) {
        const res = await OllamaApiFetch.fetch('POST', `api/generate`, JSON.stringify(generateRequest));

        if (res.ok) {
            if (generateRequest?.stream) {
                OllamaApiFetch.stream(res, hook);
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
    static async chat(chatRequest: OllamaChat, hook?: (data: OllamaResponse) => void) {
        const res = await OllamaApiFetch.fetch('POST', `api/chat`, JSON.stringify(chatRequest));

        if (res.ok) {
            if (chatRequest?.stream) {
                OllamaApiFetch.stream(res, hook);
            } else {
                const out = await res.json();

                return out;
            }
        }
        return res;
    }

    static async ping(url: string) {
        return fetch(`${url}/api/tags`, {
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

    async tags(): Promise<{ models: Record<string, any>[] }> {
        return OllamaApiFetch.fetch('GET', `api/tags`).then((res) => res);
    }

    /** Get the list of models from the Ollama API. */
    static async delete(model: string) {
        return OllamaApiFetch.fetch('DELETE', `api/delete`, JSON.stringify({ name: model }));
    }

    static async pull(model: string, hook: (args: any) => void) {
        const res = await OllamaApiFetch.fetch('POST', `api/pull`, JSON.stringify({ name: model }));
        OllamaApiFetch.stream(res, hook);
    }
}

class OllamaApiFetch {
    static jj = ollamaConfig;

    static fetch = async (method: 'GET' | 'POST' | 'DELETE', url: string, body?: string): Promise<any> => {
        let headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        return fetch(`${this.jj.options.ollama_endpoint}/${url}`, {
            headers,
            method,
            body,
            mode: 'no-cors',
        })
            .then(async (res) => {
                console.log('res', res);
                if (!res?.ok) throw await res.json();
                const contentType = res.headers.get('Content-Type');

                return contentType?.includes('stream') ? res : await res.json();
            })
            .then(async (res) => {
                return res;
            })
            .catch((error) => {
                throw error;
            });
    };
    static async stream(response: Response, hook?: (data: OllamaResponse) => void) {
        if (response?.body && response?.ok) {
            const streamReader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(this.splitStream('\n')).getReader();

            while (true) {
                const { value, done } = await streamReader.read();

                if (Boolean(done) || get(aiState) == 'request_stop') break;
                if (value) {
                    const data: OllamaResponse = JSON.parse(value);

                    if (hook) hook(data);
                }
            }
        }
    }
    private static splitStream(separator: string) {
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
