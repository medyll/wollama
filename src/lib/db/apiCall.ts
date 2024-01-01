import { aiState } from '$lib/stores';
import { ollamaParams } from '$lib/stores/ollamaParams';
import { settings } from '$lib/stores/settings';
import type { OllamaApiBody as OllamaApiBody, OllamaResponseType } from '$types/ollama';
import { get } from 'svelte/store';

export class ApiCall {
	private options = {
		model: 'llama2-uncensored'
	};

	constructor(options?: {}) {
		this.options = { ...this.options, ...options };
	}

	static async generate(prompt: string, hook?: (data: OllamaResponseType) => void, apiBody?: Partial<OllamaApiBody>) {
		const config = get(settings);
		const ollamaOptions = get(ollamaParams);

		const defaultOptions = {
			model: config?.defaultModel,
			prompt,
			system: config?.system_prompt,
			...apiBody,
			options: { ...ollamaOptions, ...apiBody?.options }
		} as OllamaApiBody;

		const res = await fetch(`${config.ollama_server}/api/generate`, {
			body: JSON.stringify(defaultOptions),
			headers: {
				'Content-Type': 'text/event-stream',
				...getHeader()
			},
			method: 'POST'
		});

		if (!res.ok) {
			throw await res.json();
		} else {
			if (apiBody?.stream) {
				this.stream(res, hook);
			} else {
				if (!res.ok) throw await res.json();
				const out = await res.json();

				return out;
			}
		}

		/* if (options?.stream) {
			this.stream(res, hook);
		} else {
			if (!res.ok) throw await res.json();
			const out = await res.json();

			return out;
		} */
		return res;
	}

	static async ping(url: string) {
		return fetch(`${url}/api/tags`, {
			headers: {
				'Content-Type': 'application/json',
				...getHeader()
			},
			method: 'GET'
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

	async listModels() {
		const config = get(settings);

		return fetch(`${config.ollama_server}/api/tags`, {
			headers: {
				'Content-Type': 'application/json',
				...getHeader()
			},
			method: 'GET'
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

	static async deleteModel(model: string) {
		const config = get(settings);
		return fetch(`${config.ollama_server}/api/delete`, {
			body: JSON.stringify({ name: model }),
			headers: {
				'Content-Type': 'application/json',
				...getHeader()
			},
			method: 'DELETE'
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return await res.json();
			})
			.then(async (res) => {
				return res;
			})
			.catch((error) => {
				throw error;
			});
	}

	static async pullModel(model: string, hook: (args: any) => void) {
		const config = get(settings);

		const res = await fetch(`${config.ollama_server}/api/pull`, {
			body: JSON.stringify({ name: model }),
			headers: {
				'Content-Type': 'text/event-stream',
				...getHeader()
			},
			method: 'POST'
		})
			.then(async (res) => {
				return res;
			})
			.then(async (res) => {
				return res;
			})
			.catch((error) => {
				throw error;
			});
		this.stream(res, hook);
	}

	static async stream(response: Response, hook?: (data: OllamaResponseType) => void) {
		/* for await (const chunk of response.body) { 
		} */

		if (response.body) {
			const streamReader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(splitStream('\n')).getReader();

			while (true) {
				const { value, done } = await streamReader.read();

				if (Boolean(done) || get(aiState) == 'request_stop') break;
				if (value) {
					const data: OllamaResponseType = JSON.parse(value);

					if (hook) hook(data);
				}
			}
		}
	}
}

function splitStream(separator: string) {
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
		}
	});
}

function getHeader() {
	return {};
}
