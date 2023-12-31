import type { ChatType } from '$types/db';
import type { MessageType } from '$types/db';
import { get } from 'svelte/store';
import { ApiCall } from '../db/apiCall';
import { settings } from '$lib/stores/settings';
import { idbQuery } from '$lib/db/dbQuery';
import type { OllamaResponseType } from '$types/ollama';

export async function askOllama(prompt: string, model: string) {}

export async function guessChatTitle(message: string): Promise<OllamaResponseType> {
	const prompt = `Generate a very short title for this content, excluding the term 'title.', never write title. Then, reply with only a few worlds, no more than six words. here is the content to resume shortly:  ${message}`;

	return await ApiCall.generate(prompt, () => {}, { stream: false });
}

export class chatUtils {
	static async checkTitle(chatId: string) {
		const chat = await idbQuery.getChat(chatId);
		const chatMessages = await idbQuery.getMessages(chatId);

		if (!chat?.title || chat?.title === 'New Chat') {
			if (chatMessages.length > 1) {
				const resume = chatMessages
					.slice(0, 2)
					.map((message: MessageType) => message.content)
					.join('\n');

				const res = await guessChatTitle(resume);

				if (res?.response !== '') idbQuery.updateChat(chatId, { title: res.response });
			}
		}
	}

	static getMessageDataObject(message: Partial<MessageType>): MessageType {
		return {
			content: message.content,
			createdAt: new Date(),
			data: [],
			edit: false,
			editedContent: '',
			messageId: crypto.randomUUID(),
			role: message.role,
			...message
		};
	}

	static getChatDataObject(chatData: ChatType = {} as ChatType): ChatType {
		return {
			chatId: crypto.randomUUID(),
			context: [],
			createdAt: new Date(),
			dateLastMessage: new Date(),
			models: [get(settings).defaultModel],
			title: 'New Chat',
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
