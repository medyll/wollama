import { activeChatId, chatter, type ChatDataType } from '$lib/stores/chatter';
import { get } from 'svelte/store';
import { chatUtils } from './chatUtils';
import { aiResponseState } from '$lib/stores/chatEditListener';
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch';
import { dbQuery } from '../db/chatDb';

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
			? await dbQuery.getChat(activeId as string)
			: await dbQuery.insertChat();

		return chat;
	}

	static async sendMessage(chatId: string, content: string, cb: (args: chatSenderMessageCB) => {}) {
		const chat = await dbQuery.getChat(chatId);
		// add messages to db
		await dbQuery.insertMessage(chatId, { role: 'user', content, chatId });
		const messageAssistant = await dbQuery.insertMessage(chatId, { role: 'assistant', chatId });


		aiResponseState.set('running');

		let args = { prompt: content, context: chat?.context ?? [], models: chat.models };
		// use args as a parameter
		this.sendPrompt(args, async (data) =>
			cb({ chatId, assistantMessageId: messageAssistant.messageId, data })
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
