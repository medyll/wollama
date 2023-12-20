

export const defaultOllamaSettings = {
    seed: undefined,
    temperature: 0.5,
    repeat_penalty: undefined,
    top_k: undefined,
    top_p: undefined,
    num_ctx: undefined,
}

export const defaultOptions  = {
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
    temperatures:{
        creative: 0.1,
        balanced: 0.5,
        accurate: 1,
    },
    llamaOptions:{
        seed: undefined,
        temperature: 0.5,
        repeat_penalty: undefined,
        top_k: undefined,
        top_p: undefined,
        num_ctx: undefined,   
    }
};

