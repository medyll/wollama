//import { Ollama } from 'ollama-node';
import type { MessageType } from '../stores/messages';
import { OllamaFetch } from './ollamaFetch';

const systemprompt = '';

export async function askOllama(prompt: string, model: string) {
	/* try {
		const ollama = new Ollama();
		await ollama.setModel('llama2-uncensored');

		await ollama.setSystemPrompt(systemprompt);

		const output = await ollama.generate(prompt);
		return output.output;
	} catch (error) {
		console.error(error);
	} */
}

export async function guessChatTitle(message: MessageType): Promise<{
	output: any;
	stats: any;
}> {
	const prompt = `You must generate a short title, maximum 4 words long,  for this following message, excluding the term 'title.' 
	Then, please reply with only the title and never more than 5 words. here is the message :  ${message?.content}`;

	const ollama_fetch = new OllamaFetch();
	return await ollama_fetch.generate(prompt);
 
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

export const createChat = () => {
	return {
		id: crypto.randomUUID(),
		title: 'New Chat',
		models: [],
		messages: {}
	};
};
