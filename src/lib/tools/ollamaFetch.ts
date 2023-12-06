export type ReaderData = {
	model: string;
	create_at: string;
	done: boolean;
	response: string;
	context: any;
	total_duration: number;
	load_duration: number;
	prompt_eval_count: number;
	prompt_eval_duration: number;
	eval_count: number;
	eval_duration: number;
};

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
}
