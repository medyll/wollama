


export const defaultOptions  = {
	defaultModel: 'llama2-uncensored',
    ollama_server: process.env.PUBLIC_OLLAMA_SERVER_API,
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