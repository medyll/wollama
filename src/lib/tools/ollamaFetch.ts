import { settings,   } from '$lib/stores/settings';
import { ui } from '$lib/stores/ui';
import type { OllamaFetchBodyType, OllamaResponseType } from '$types/ollama';
import { get } from 'svelte/store';


export class OllamaFetch {
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
		get(ui).stopSystemResponse = false;

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
				'Content-Type': 'text/event-stream'
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
		return fetch(`http://127.0.0.1:11434/api/tags`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
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

	static async stream(query, hook?: (data: OllamaResponseType) => void) {
		const streamReader = query.body
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(splitStream('\n'))
			.getReader();

		while (true ?? !get(ui).stopSystemResponse) {
			const { value, done } = await streamReader.read();

			if (done) {
				break;
			}
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
