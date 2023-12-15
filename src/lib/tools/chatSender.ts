import { activeChatId, chatter } from '$lib/stores/chatter';
import { get } from 'svelte/store';
import { chatUtils } from './chatUtils';
import { aiResponseState } from '$lib/stores/chatEditListener'; 
import { OllamaFetch, type OllamaStreamLine } from './ollamaFetch';

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
	static initChat(): string {
		let chatId = get(activeChatId);
		if (!get(activeChatId)) {
			const newChat = chatUtils.createChatData();
			chatId = newChat.id;
			// set ActiveId
			activeChatId.set(newChat.id);
			// add chat to store.initChat
			chatter.insertChat(newChat);
		}
		return chatId as string;
	}

	static sendMessage(content: string, cb: (args: chatSenderMessageCB) => {}) {
		const chatId = this.initChat();
		const chat = chatter.getChat(chatId);
		//
		const messageUser = chatUtils.createMessageData({ role: 'user', content, chatId });
		const messageAssistant = chatUtils.createMessageData({ role: 'assistant' });

		// add messages to store
		chatter.insertMessage(chatId, messageUser);
		chatter.insertMessage(chatId, messageAssistant);

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
				await OllamaFetch.generate(sender.prompt, hook, { sync: true, model });
			})
		);
	}
}
