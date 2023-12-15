import type { ChatDataType } from "$lib/stores/chatter";
import type { MessageType } from "$lib/stores/messages";
import { chatUtils } from "$lib/tools/chatUtils";
import type { OllamaStreamLine } from "$lib/tools/ollamaFetch";
import { dbase } from "./db";

export class chatDB { 

    static async getChat(chatId: string) {
        if(!chatId) throw new Error('chatId is required');
        return dbase.chat.get(chatId);
    }

	static async insertChat(chatData?: ChatDataType):Promise<ChatDataType> {
        console.log('dbase', dbase); 
		const newChat = chatUtils.getChatDataObject();
		await dbase.chat.add({ ...newChat, ...chatData });
        return { ...newChat, ...chatData };
	}

	static async updateChat(chatId: string, chatData: Partial<ChatDataType>) {
        if(!chatId) throw new Error('chatId is required');
		await dbase.chat.update(chatId, chatData);
	}

	static async insertMessage(chatId: string,messageData: Partial<MessageType>) {
        if(!chatId) throw new Error('chatId is required');
        const message  = chatUtils.getMessageDataObject({chatId,...messageData});
		await dbase.messages.add(messageData as MessageType);

        return message;
	}

	static async updateMessage(messageId: string, messageData: Partial<MessageType>) {
        if(!messageId) throw new Error('messageId is required');
		await dbase.messages.update(messageId, messageData);
	}

    static async insertMessageStats(statsData: Partial<OllamaStreamLine>) {
        if(!statsData.messageId) throw new Error('messageId is required');
        const stats = chatUtils.getMessageStatsObject(statsData);
        await dbase.messageStats.add(stats);
    }
}