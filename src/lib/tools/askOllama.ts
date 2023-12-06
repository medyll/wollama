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

export async function guessChatTitle(message: MessageType): Promise<{
	output: any;
	stats: any;
}> {
	const prompt = `You must generate a short title, around 3 to 5 words, for this following message, excluding the term 'title.' 
	Then, please reply with only the title. here is the message : \n ${message?.content}`;
console.log( {prompt});
	const ollama = new Ollama();
	await ollama.setModel('llama2-uncensored');
	await ollama.setSystemPrompt('systemprompt');
	return await ollama.generate(prompt);
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
