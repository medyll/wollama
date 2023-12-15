import { activeChatId, chatter, type ChatDataType } from '$lib/stores/chatter';
import { get } from 'svelte/store';
import { chatUtils } from './chatUtils';
import { aiResponseState } from '$lib/stores/chatEditListener';
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch';
import { chatDB } from '../db/chatDb';

export type PromptSenderType = {
	prompt: string;
	context: number[];
	models: string[];
};

export type chatSenderMessageCB = {
	chatId: string;
	assistantMessageId: string;
	data: OllamaStreamLine;
};
export class chatSender {
	static async initChat(): Promise<ChatDataType> {
		let activeId = get(activeChatId);
		const chat: ChatDataType = activeId
			? await chatDB.getChat(activeId as string)
			: await chatDB.insertChat();

		return chat;
	}

	static async sendMessage(content: string, cb: (args: chatSenderMessageCB) => {}) {
		const chat = await this.initChat();
		const chatId = chat.chatId;

		// add messages to store
		const messageUser = await chatter.insertMessage(chatId, { role: 'user', content, chatId });
		const messageAssistant = await chatter.insertMessage(chatId, { role: 'assistant' });

		// add messages to db
		chatDB.insertMessage(chatId, { role: 'user', content, chatId });
		chatDB.insertMessage(chatId, { role: 'assistant', chatId });

		aiResponseState.set('running');

		let args = { prompt: content, context: chat?.context ?? [], models: chat.models };
		// use args as a parameter
		this.sendPrompt(args, async (data) =>
			cb({ chatId, assistantMessageId: messageAssistant.id, data })
		);
	}

	static async sendPrompt(sender: PromptSenderType, hook: (data: OllamaStreamLine) => void) {
		await Promise.all(
			sender.models.map(async (model) => {
				await OllamaFetch.generate(sender.prompt, hook, { sync: false, model });
			})
		);
	}
}
