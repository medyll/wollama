import { aiState } from '$lib/stores';
import { settings } from '$lib/stores/settings';
import { ui } from '$lib/stores/ui';
import type { OllamaFetchBodyType, OllamaResponseType } from '$types/ollama';
import { get } from 'svelte/store';

export class ApiCall {
	private options = {
		model: 'llama2-uncensored'
	};

	constructor(options?: {}) {
		this.options = { ...this.options, ...options };
	}

	static async generate(
		prompt: string,
		hook?: (data: OllamaResponseType) => void,
		options?: Partial<OllamaFetchBodyType>
	) {
		const config = get(settings);
		const defaultOptions = {
			prompt,
			system: config?.system_prompt,
			model: config?.defaultModel,
			options: config.llamaOptions,
			context: [],
			// format: settings?.format,
			...options
		};

		const res = await fetch(`${config.ollama_server}/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/event-stream',
				...getHeader()
			},
			body: JSON.stringify(defaultOptions)
		});

		if (options?.stream) {
			this.stream(res, hook);
		} else {
			if (!res.ok) throw await res.json();
			const out = await res.json();

			return out;
		}
		return res;
	}

	async listModels() {
		const config = get(settings);
		return fetch(`${config.ollama_server}/api/tags`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				...getHeader()
			}
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
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
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				...getHeader()
			},
			body: JSON.stringify({ name: model })
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

	static async pullModel(model: string,hook:(args:any)=>void) {
		const config = get(settings);
			console.log('res',model)
		const res = await fetch(`${config.ollama_server}/api/pull`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/event-stream',
				...getHeader()
			},
			body: JSON.stringify({ name: model })
		})
			.then(async (res) => {
				 
				return   res 
			})
			.then(async (res) => {
				return res;
			})
			.catch((error) => {
				throw error;
			});
			console.log(res)
		this.stream(res, hook);
	}

	static async stream(query, hook?: (data: OllamaResponseType) => void) {
		const streamReader = query.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(splitStream('\n'))
			.getReader();

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

function splitStream(separator: string) {
	let buffer = '';
	return new TransformStream({
		transform(chunk, controller) {
			buffer += chunk;
			const parts = buffer.split(separator);
			parts.slice(0, -1).forEach((part) => controller.enqueue(part));
			buffer = parts[parts.length - 1];
		},
		flush(controller) {
			if (buffer) controller.enqueue(buffer);
		}
	});
}

function getHeader() {
	return {};
}
