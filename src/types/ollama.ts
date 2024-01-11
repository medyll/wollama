// Type definitions for Ollama API
export type OllamaCompletionBody = {
	model: string;
	prompt: string;
	images: string[];
	format: 'json' | 'plain' | '' | string;
	options: OllamaOptionsType;
	system: string | null;
	template: string | null;
	context: number[];
	stream?: boolean;
	raw?: boolean;
};
export type OllamaChatCompletionBodyMessage = {
	role: 'user' | 'system' | 'assistant';
	content: string;
	images?: string[];
};
export type OllamaChatCompletionBody = {
	model: string;
	messages: OllamaChatCompletionBodyMessage[];
	format?: 'json' | 'plain' | '' | string;
	options?: OllamaOptionsType;
	template?: string | null;
	stream?: boolean;
};

export type OllamaResponseType = {
	messageId: string;
	model: string;
	create_at: string;
	response: string;
	done: boolean;
	context: number[];
	createdAt: string;
	eval_count: number;
	eval_duration: number;
	load_duration: number;
	prompt_eval_count: number;
	prompt_eval_duration: number;
	total_duration: number;
};

export type OllamaOptionsType = {
	seed?: number;
	temperature?: number;
	repeat_penalty?: number;
	top_k?: number;
	top_p?: number;
	num_ctx?: number;
	mirostat?: number;
	mirostat_eta?: number;
	mirostat_tau?: number;
	num_gqa?: number;
	num_gpu?: number;
	num_thread?: number;
	repeat_last_n?: number;
	stop?: string;
	tfs_z?: number;
	num_predict?: number;
};
