import type { ChatDataType } from '$lib/stores/chatter';
import type { MessageType } from '$lib/stores/messages';
import { chatUtils } from '$lib/tools/chatUtils';
import type { OllamaStreamLine } from '$lib/tools/ollamaFetch';
import { dbase } from './db';

export class dbQuery {
	
	static async getChat(chatId: string) {
		if (!chatId) throw new Error('chatId is required');
		return await dbase.chat.where('chatId').equals(chatId).first();
	}

	static async getChats() {		
		return await dbase.chat.toArray();
	}

	static async insertChat(chatData?: ChatDataType): Promise<ChatDataType> {
		const newChat = chatUtils.getChatDataObject();
		await dbase.chat.add({ ...newChat, ...chatData });
		return { ...newChat, ...chatData };
	}

	static async updateChat(chatId: string, chatData: Partial<ChatDataType>) {
		if (!chatId) throw new Error('chatId is required');

		await dbase.chat.update(chatId, chatData);
	}

	static async initChat(activeChatId?: string): Promise<ChatDataType> {
		return activeChatId
			? await dbQuery.getChat(activeChatId as string)
			: await dbQuery.insertChat();
	}

	static async insertMessage(chatId: string, messageData: Partial<MessageType>) {
		if (!chatId) throw new Error('chatId is required');
		const message = chatUtils.getMessageDataObject({ chatId, ...messageData });

		await dbase.messages.add(message as MessageType);

		return message;
	}

	static async updateMessage(messageId: string, messageData: Partial<MessageType>) {
		if (!messageId) throw new Error('messageId is required');

		await dbase.messages.update(messageId, { messageId, ...messageData });
	}

	static async getMessage(messageId: string) {
		if (!messageId) throw new Error('chatId is required');
		return await dbase.messages.where('messageId').equals(messageId).first();
	}

	static async getMessages(chatId: string) {
		if (!chatId) throw new Error('chatId is required');
		return await dbase.messages.where('chatId').equals(chatId).sortBy('dateCreation');
	}

	static async insertMessageStats(statsData: Partial<OllamaStreamLine>) {
		if (!statsData.messageId) throw new Error('messageId is required');
		const stats = chatUtils.getMessageStatsObject(statsData);
		await dbase.messageStats.add(stats);
	}
}
