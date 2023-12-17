import type { ChatType, MessageType } from '$types/db'; 
import type { OllamaResponseType } from '$types/ollama';
import { chatUtils } from '$lib/tools/chatUtils';
import { dbase } from './dbSchema';

export class dbQuery {
	
	static async getChat(chatId: string) {
		if (!chatId) throw new Error('chatId is required');
		return await dbase.chat.where('chatId').equals(chatId).first();
	}

	static async getChats() {		
		return await dbase.chat.toArray();
	}

	static async insertChat(chatData?: ChatType): Promise<ChatType> {
		const newChat = chatUtils.getChatDataObject();
		await dbase.chat.add({ ...newChat, ...chatData });
		return { ...newChat, ...chatData };
	}

	static async updateChat(chatId: string, chatData: Partial<ChatType>) {
		if (!chatId) throw new Error('chatId is required');

		await dbase.chat.update(chatId, chatData);
	}

	static async initChat(activeChatId?: string): Promise<ChatType> {
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

	static getMessages(chatId: string) {
		if (!chatId) throw new Error('chatId is required');
		return   dbase.messages.where('chatId').equals(chatId).sortBy('dateCreation');
	}

	static async insertMessageStats(statsData: Partial<OllamaResponseType>) {
		if (!statsData.messageId) throw new Error('messageId is required');
		const stats = chatUtils.getMessageStatsObject(statsData);
		await dbase.messageStats.add(stats);
	}
}
