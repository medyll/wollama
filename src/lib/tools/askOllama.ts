//import { Ollama } from 'ollama-node';
import type { MessageType } from '../stores/messages';
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch';

export async function askOllama(prompt: string, model: string) {

}

export async function guessChatTitle(message: string): Promise<OllamaStreamLine> {
	const prompt = `Generate a very short title for this content, excluding the term 'title.' Then, please reply with only a few worlds:  ${message}`;

	const ollama_fetch = new OllamaFetch();
	return await ollama_fetch.generate(prompt);
 
}


export const createMessage = (message: Partial<MessageType>) => {
	return {
		id: crypto.randomUUID(),
		edit: false,
		editedContent: '',
		parentId: message?.parentId ?? null,
		content: message.content,
		role: message.role
	};
};

export const createChat = (chatData:any= {}  ) => {
	return {
		id: crypto.randomUUID(),
		title: 'New Chat',
		models: [],
		messages: {},
		resume: '',
		dateCreation: new Date(),
		dateLastMessage: new Date(),
		...chatData
	};
};


export const chatObject = {
	createMessage,
	createChat
};