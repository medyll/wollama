import ollama from 'ollama';

export const OllamaService = {
    async chat(messages, model = 'mistral') {
        try {
            const response = await ollama.chat({
                model: model,
                messages: messages,
                stream: true
            });
            return response;
        } catch (error) {
            console.error('Ollama Chat Error:', error);
            throw error;
        }
    },

    async listModels() {
        return await ollama.list();
    }
};
