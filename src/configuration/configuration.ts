export const defaultOllamaSettings = {
	num_ctx: undefined,
	repeat_last_n: undefined,
	repeat_penalty: undefined,
	seed: undefined,
	temperature: 0.5,
	top_k: undefined,
	top_p: undefined
};

export const ollamaOptionsRanges = {
	num_ctx: [0, 100, 1],
	repeat_last_n: [0, 100, 1],
	repeat_penalty: [0, 100, 1],
	seed: undefined,
	temperature: [0, 1, 0.01],
	top_k: [0, 100, 1],
	top_p: [0, 1, 0.01]
};

export const defaultSettings = {
	authHeader: false,
	avatar_email: '',
	defaultModel: 'llama2-uncensored',
	locale: 'fr',
	ollama_server: import.meta.env.PUBLIC_OLLAMA_SERVER_API,
	request_mode: 'plain',
	sender: {
		speechAutoSend: false,
		speechRecognition: true
	},
	system_prompt: '',
	temperatures: {
		accurate: 1,
		balanced: 0.5,
		creative: 0.1
	},
	theme: 'light',
	title_auto: true,
	voice_auto_stop: true
};

export const OllamaOptionsDefaults = {
	mirostat: { default: undefined, max: 2, min: 0 },
	mirostat_eta: { default: undefined, max: 1, min: 0 },
	mirostat_tau: { default: undefined, max: 20, min: 0 },
	num_ctx: { default: undefined, max: 10240, min: 0 },
	num_gpu: { default: undefined, max: undefined, min: 0 },
	num_gqa: { default: undefined, max: undefined, min: 0 },
	repeat_penalty: { default: undefined, max: 2, min: 0 },
	num_predict: { default: undefined, max: undefined, min: -2 },
	seed: { default: undefined, max: undefined, min: 0 },
	num_thread: { default: undefined, max: undefined, min: 0 },
	temperature: { default: 0.5, max: 1, min: 0 },
	repeat_last_n: { default: undefined, max: undefined, min: 0 },
	top_k: { default: undefined, max: 200, min: 0 },
	stop: { default: ['STOP AI'], max: undefined, min: 0 },
	top_p: { default: undefined, min: 0, max: 1 },
	tfs_z: { default: undefined, max: undefined, min: 0 }
} as const;

type OllamaOptionsType = {
	name: string;
	description: string;
	type: 'number' | 'string';
};
export const ollamaOptionsCatalog: Record<keyof typeof OllamaOptionsDefaults, OllamaOptionsType> = {
	mirostat: {
		name: 'Mirostat',
		description: 'Enable Mirostat sampling for controlling perplexity. (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)',
		type: 'number'
	},
	mirostat_eta: {
		name: 'Mirostat Eta',
		description: 'Influences how quickly the algorithm responds to feedback from the generated text. A lower learning rate will result in slower adjustments, while a higher learning rate will make the algorithm more responsive. (Default: 0.1)',
		type: 'number'
	},
	mirostat_tau: {
		name: 'Mirostat Tau',
		description: 'Controls the balance between coherence and diversity of the output. A lower value will result in more focused and coherent text. (Default: 5.0)',
		type: 'number'
	},
	num_ctx: {
		name: 'Context Window',
		description: 'Sets the size of the context window used to generate the next token. (Default: 2048)',
		type: 'number'
	},
	num_gpu: {
		name: 'GPU Layers',
		description: 'The number of layers to send to the GPU(s). On macOS it defaults to 1 to enable metal support, 0 to disable.',
		type: 'number'
	},
	num_gqa: {
		name: 'GQA Groups',
		description: 'The number of GQA groups in the transformer layer. Required for some models, for example it is 8 for llama2:70b',
		type: 'number'
	},
	repeat_penalty: {
		name: 'Repeat Penalty',
		description: 'Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient. (Default: 1.1)',
		type: 'number'
	},
	num_predict: {
		name: 'Prediction Length',
		description: 'Maximum number of tokens to predict when generating text. (Default: 128, -1 = infinite generation, -2 = fill context)',
		type: 'number'
	},
	seed: {
		name: 'Seed',
		description: 'Sets the random number seed to use for generation. Setting this to a specific number will make the model generate the same text for the same prompt. (Default: 0)',
		type: 'number'
	},
	num_thread: {
		name: 'Threads',
		description: 'Sets the number of threads to use during computation. By default, Ollama will detect this for optimal performance. It is recommended to set this value to the number of physical CPU cores your system has (as opposed to the logical number of cores).',
		type: 'number'
	},
	temperature: {
		name: 'Temperature',
		description: 'The temperature of the model. Increasing the temperature will make the model answer more creatively. (Default: 0.8)',
		type: 'number'
	},
	repeat_last_n: {
		name: 'Repeat Last N',
		description: 'Sets how far back for the model to look back to prevent repetition. (Default: 64, 0 = disabled, -1 = num_ctx)',
		type: 'number'
	},
	top_k: {
		name: 'Top K',
		description: 'Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40)',
		type: 'number'
	},
	stop: {
		name: 'Stop Sequences',
		description: 'Sets the stop sequences to use. When this pattern is encountered the LLM will stop generating text and return. Multiple stop patterns may be set by specifying multiple separate stop parameters in a modelfile.',
		type: 'string'
	},
	top_p: {
		name: 'Top P',
		description: 'Works together with top-k. A higher value (e.g., 0.95) will lead to more diverse text, while a lower value (e.g., 0.5) will generate more focused and conservative text. (Default: 0.9)',
		type: 'number'
	},
	tfs_z: {
		name: 'Tail Free Sampling',
		description: 'Tail free sampling is used to reduce the impact of less probable tokens from the output. A higher value (e.g., 2.0) will reduce the impact more, while a value of 1.0 disables this setting. (default: 1)',
		type: 'number'
	}
};

export const ollamaOptionsInfo = {
	mirostat: 'Enable Mirostat sampling for controlling perplexity. (default: 0, 0 = disabled, 1 = Mirostat, 2 = Mirostat 2.0)',
	mirostat_eta: 'Influences how quickly the algorithm responds to feedback from the generated text. A lower learning rate will result in slower adjustments, while a higher learning rate will make the algorithm more responsive. (Default: 0.1)',
	mirostat_tau: 'Controls the balance between coherence and diversity of the output. A lower value will result in more focused and coherent text. (Default: 5.0)',
	num_ctx: 'Sets the size of the context window used to generate the next token. (Default: 2048)',
	num_gpu: 'The number of layers to send to the GPU(s). On macOS it defaults to 1 to enable metal support, 0 to disable.',
	num_gqa: 'The number of GQA groups in the transformer layer. Required for some models, for example it is 8 for llama2:70b',
	repeat_penalty: 'Sets how strongly to penalize repetitions. A higher value (e.g., 1.5) will penalize repetitions more strongly, while a lower value (e.g., 0.9) will be more lenient. (Default: 1.1)',
	num_predict: 'Maximum number of tokens to predict when generating text. (Default: 128, -1 = infinite generation, -2 = fill context)',
	seed: 'Sets the random number seed to use for generation. Setting this to a specific number will make the model generate the same text for the same prompt. (Default: 0)',
	num_thread: 'Sets the number of threads to use during computation. By default, Ollama will detect this for optimal performance. It is recommended to set this value to the number of physical CPU cores your system has (as opposed to the logical number of cores).',
	temperature: 'The temperature of the model. Increasing the temperature will make the model answer more creatively. (Default: 0.8)',
	repeat_last_n: 'Sets how far back for the model to look back to prevent repetition. (Default: 64, 0 = disabled, -1 = num_ctx)',
	top_k: 'Reduces the probability of generating nonsense. A higher value (e.g. 100) will give more diverse answers, while a lower value (e.g. 10) will be more conservative. (Default: 40)',
	stop: 'Sets the stop sequences to use. When this pattern is encountered the LLM will stop generating text and return. Multiple stop patterns may be set by specifying multiple separate stop parameters in a modelfile.',
	top_p: 'Works together with top-k. A higher value (e.g., 0.95) will lead to more diverse text, while a lower value (e.g., 0.5) will generate more focused and conservative text. (Default: 0.9)',
	tfs_z: 'Tail free sampling is used to reduce the impact of less probable tokens from the output. A higher value (e.g., 2.0) will reduce the impact more, while a value of 1.0 disables this setting. (default: 1)'
} as const;
