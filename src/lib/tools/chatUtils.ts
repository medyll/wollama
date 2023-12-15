import { chatter, type ChatDataType } from '$lib/stores/chatter';
import { get } from 'svelte/store';
import type { MessageListType, MessageType } from '../stores/messages';
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch';
import { settings } from '$lib/stores/settings';

export async function askOllama(prompt: string, model: string) {}

export async function guessChatTitle(message: string): Promise<OllamaStreamLine> {
	const prompt = `Generate a very short title for this content, excluding the term 'title.', never write title. Then, please reply with only a few worlds:  ${message}`;

	const ollama_fetch = new OllamaFetch();
	return (await OllamaFetch.generate(prompt)).body;
}

export class chatUtils {
	static async checkTitle(chatId: string) {
		const chat = chatter.getChat(chatId);

		if (chat?.title === 'New Chat') { 
			const messages: MessageListType = chat.messages;

			if (chat.title == 'New Chat' && Object.values(messages).length > 1) {
				const resume = Object.values(messages)
					.slice(0, 2)
					.map((message: MessageType) => message.content)
					.join('\n');

				const res = await guessChatTitle(resume);
				//
				if (res?.response !== '') chatter.updateChat(chatId, { title: res.response });
			}
		}
	}

	static createMessageData(message: Partial<MessageType>):MessageType {
		return {
			id: crypto.randomUUID(),
			edit: false,
			editedContent: '',
			content: message.content,
			role: message.role,
			data: []
		};
	}

	static createChatData(chatData: Partial<ChatDataType> = {}):ChatDataType {
		return {
			id: crypto.randomUUID(),
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
}
