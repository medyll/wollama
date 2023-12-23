export const defaultOllamaSettings = {
	seed: 0,
	temperature: 0.5,
	repeat_last_n: '',
	repeat_penalty: '',
	top_k: '',
	top_p: '',
	num_ctx: ''
};

export const ollamaOptionsRanges = {
	seed: undefined,
	temperature: [0, 1, 0.01],
	repeat_last_n: [0, 100, 1],
	repeat_penalty: [0, 100, 1],
	top_k: [0, 100, 1],
	top_p: [0, 1, 0.01],
	num_ctx: [0, 100, 1]
};

export const defaultOptions = {
	defaultModel: 'llama2-uncensored',
	ollama_server: 'http://127.0.0.1:11434',
	authHeader: false,
	system_prompt: '',
	request_mode: 'plain',
	title_auto: true,
	voice_auto_stop: true,
	avatar_email: '',
	sender: {
		speechAutoSend: false,
		speechRecognition: true
	},
	temperatures: {
		creative: 0.1,
		balanced: 0.5,
		accurate: 1
	},
	ollamaOptions: defaultOllamaSettings
};
