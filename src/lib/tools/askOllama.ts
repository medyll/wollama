import { Ollama } from 'ollama-node';
import type { MessageType } from '../stores/messages';

const systemprompt = '';

export async function askOllama(prompt: string, model: string) {
	try {
		const ollama = new Ollama();
		await ollama.setModel('llama2-uncensored');

		await ollama.setSystemPrompt(systemprompt);

		const output = await ollama.generate(prompt);
		return output.output;
	} catch (error) {
		console.error(error);
	}
}

export const createMessage = (message: MessageType) => {
	return {
		id: crypto.randomUUID(),
		edit: false,
		editedContent: '',
		parentId: message?.parentId ?? null,
		childrenIds: [],
		content: message.content,
		role: message.role
	};
};
