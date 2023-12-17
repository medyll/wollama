import type { ChatType } from '$types/db';
import type { MessageType } from '$types/db';
import { get } from 'svelte/store';
import { OllamaFetch, } from './ollamaFetch';
import { settings } from '$lib/stores/settings';
import { dbQuery } from '$lib/db/dbQuery';
import type { OllamaResponseType } from '$types/ollama';

export async function askOllama(prompt: string, model: string) {}

export async function guessChatTitle(message: string): Promise<OllamaResponseType> {
	const prompt = `Generate a very short title for this content, excluding the term 'title.', never write title. Then, please reply with only a few worlds:  ${message}`;

	const ollama_fetch = new OllamaFetch();
	return (await OllamaFetch.generate(prompt,()=>{}, {stream:false}));
}

export class chatUtils {
	static async checkTitle(chatId: string) {
		const chat = await dbQuery.getChat(chatId);
		const chatMessages = await dbQuery.getMessages(chatId);

		if (!chat?.title || chat?.title === 'New Chat') {
			if (chatMessages.length > 1) {
				const resume = chatMessages
					.slice(0, 2)
					.map((message: MessageType) => message.content)
					.join('\n');

				const res = await guessChatTitle(resume);
				
				if (res?.response !== '') dbQuery.updateChat(chatId, { title: res.response });
			}
		}
	}

	static getMessageDataObject(message: Partial<MessageType>): MessageType {
		return {
			messageId: crypto.randomUUID(),
			dateCreation: new Date(),
			edit: false,
			editedContent: '',
			content: message.content,
			role: message.role,
			data: [],
			...message
		};
	}

	static getChatDataObject(chatData: Partial<ChatType> = {}): ChatType {
		return {
			chatId: crypto.randomUUID(),
			title: 'New Chat',
			models: [get(settings).defaultModel],
			messages: {},
			resume: '',
			dateCreation: new Date(),
			dateLastMessage: new Date(),
			context: [],
			...chatData
		};
	}

	static getMessageStatsObject(messageData: Partial<OllamaResponseType>): OllamaResponseType {
		return {
			messageId: crypto.randomUUID(),
			...messageData
		};
	}
}
