export type OllamaStream = {
	done: boolean;
	value: string;
};

export type OllamaStreamLine = {
	model: string;
	create_at: string;
	response: string;
	done: boolean;
	context: number[];
	created_at: string;
	eval_count: number;
	eval_duration: number;
	load_duration: number;
	prompt_eval_count: number;
	prompt_eval_duration: number;
	total_duration: number;
};
export interface OllamaStreamLineLast {
}

export class OllamaFetch {
	private options = {
		model: 'llama2-uncensored'
	};
 

	constructor(options?: {}) {
		this.options = { ...this.options, ...options };
	}

	async generate(prompt: string, model?: undefined) {
		return fetch(`http://127.0.0.1:11434/api/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/event-stream'
			},
			body: JSON.stringify({
				model: model ?? this.options.model,
				prompt,
				stream: false
			})
		})
			.then(async (res) => {
				if (!res.ok) throw await res.json();
				return await res.json();
			})
			.catch((error) => {
				throw error;
			});
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
				throw error
			});
	}

	 
}
