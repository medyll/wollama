

export const defaultOptions  = {
	defaultModel: 'llama2-uncensored',
    ollama_server: 'http://127.0.0.1:11434',
    auth: false,
    system_prompt: '',
	sender: {
		speechAutoSend: false,
		speechRecognition: 'en-US'
	}, 
};

export const defaultOllamaSettings = {
    seed: undefined,
    temperature: 0.4,
    repeat_penalty: undefined,
    top_k: undefined,
    top_p: undefined,
    num_ctx: undefined,
}