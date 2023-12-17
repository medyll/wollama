// Type definitions for Ollama API
export type OllamaFetchBodyType = {
	prompt: string;
	stream: boolean;
	model: string;
	context: number[];
	options: OllamaOptionsType;
	images?: string[];
};

export type OllamaResponseType = {
	messageId: string;
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

export type OllamaOptionsType = {
	seed?: string;
	temperature?: number;
	repeat_penalty?: number;
	top_k?: number;
	top_p?: number;
	num_ctx?: number;
};
