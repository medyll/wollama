import type { DbChat, DBMessage, PromptType } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import { chatUtils } from '$lib/tools/chatUtils';
import { idbqlState } from './dbSchema';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';

export class idbQuery {
    /* chat */
    static getChat(chatId: string) {
        if (!chatId || !idbqlState?.chat) return undefined; // throw new Error('chatId is required');
        return idbqlState.chat.where({ chatId: { eq: chatId } })[0];
    }

    static getChats() {
        return idbqlState.chat.getAll();
    }

    static async insertChat(chatData?: DbChat): Promise<DbChat> {
        const newChat = chatUtils.getChatDataObject();
        await idbqlState.chat.add({ ...newChat, ...chatData });
        return { ...newChat, ...chatData };
    }

    static async deleteChat(chatId?: string): Promise<string> {
        if (!chatId) throw new Error('chatId is required');

        await idbqlState.messages.deleteWhere({ chatId: { eq: chatId } });
        await idbqlState.chat.delete(chatId);

        return chatId;
    }

    static async updateChat(chatId: string, chatData: Partial<DbChat>) {
        if (!chatId) throw new Error('chatId is required');

        await idbqlState.chat.update(chatId, chatData);
        return { chatId, ...chatData };
    }

    static async initChat(activeChatId?: string, chatData: DbChat = {} as DbChat): Promise<DbChat> {
        console.log('initChat', activeChatId, chatData);
        if (Boolean(await idbQuery.getChat(activeChatId as string))) {
            await idbQuery.updateChat(activeChatId as string, chatData);
        }

        return activeChatId && Boolean(await idbQuery.getChat(activeChatId as string))
            ? ((await idbQuery.getChat(activeChatId as string)) as DbChat)
            : ((await idbQuery.insertChat(chatData)) as DbChat);
    }

    /* Message */

    static async insertMessage(chatId: string, messageData: Partial<DBMessage>): Promise<DBMessage> {
        if (!chatId) throw new Error('chatId is required');
        const message = chatUtils.getMessageDataObject({ chatId, ...messageData });

        await idbqlState.messages.add(message);

        return message;
    }

    static async updateMessage(messageId: string, messageData: Partial<DBMessage>) {
        if (!messageId) throw new Error('messageId is required');

        await idbqlState.messages.update(messageId, { messageId, ...messageData });
    }

    static async updateMessageStream(messageId: string, data: Partial<OllamaResponse>) {
        if (!messageId) throw new Error('messageId is required');
        const message = await idbQuery.getMessage(messageId);
        await idbQuery.updateMessage(messageId, {
            content: (message?.content ?? '') + (data?.response ?? data?.message?.content ?? ''),
            status: 'streaming',
        });
    }

    static async getMessage(messageId: string) {
        if (!messageId) throw new Error('messageId is required');
        return idbqlState.messages.where({ messageId: { eq: messageId } })[0];
    }

    static getMessages(chatId: string) {
        if (!chatId) return []; //throw new Error('chatId is required');
        return idbqlState.messages.where({ chatId: { eq: chatId } }).sortBy({ createdAt: 'asc' });
    }
    /* MessageStats */
    static async insertMessageStats(statsData: Partial<OllamaResponse>) {
        if (!statsData.messageId) throw new Error('messageId is required');
        const stats = chatUtils.getMessageStatsObject(statsData);
        await idbqlState.messageStats.add(stats);
    }
    /* Prompt */
    static async getPrompt(promptId: string) {
        if (!promptId) throw new Error('promptId is required');
        return await idbqlState.prompts.where('id').equals(promptId).first();
    }

    static async getPrompts() {
        return await idbqlState.prompts.getAll();
    }

    static async insertPrompt(promptData: Partial<PromptType>) {
        return await idbqlState.prompts.put(promptData as PromptType);
    }

    static async updatePrompt(id: number, promptData: Partial<PromptType>) {
        if (!id) throw new Error('id is required');
        return await idbqlState.prompts.update(id, promptData);
    }

    static async deletePrompt(promptId: number) {
        if (!promptId) throw new Error('promptId is required');
        return await idbqlState.prompts.delete(promptId);
    }
    /* Settings */
    static async getSettings() {
        return await idbqlState.settings.getAll();
    }
    static async insertSettings(settingsData: Partial<SettingsType>) {
        return await idbqlState.settings.put(settingsData as SettingsType);
    }
    static async updateSettings(id: number, settingsData: Partial<SettingsType>) {
        if (!id) throw new Error('id is required');
        return await idbqlState.settings.update(id, settingsData);
    }
    static async deleteSettings(id: number) {
        if (!id) throw new Error('id is required');
        return await idbqlState.settings.delete(id);
    }

    /* User */
    static async getUser(id: number) {
        if (!id) throw new Error('id is required');
        return idbqlState.user.where({ id: { eq: id } })[0];
    }

    static async getUsers() {
        return await idbqlState.user.getAll();
    }

    static async insertUser(userData: Partial<UserType>) {
        return await idbqlState.user.put(userData as UserType);
    }

    static async updateUser(id: number, userData: Partial<UserType>) {
        if (!id) throw new Error('id is required');
        return await idbqlState.user.update(id, userData);
    }

    static async deleteUser(id: number) {
        if (!id) throw new Error('id is required');
        return await idbqlState.user.delete(id);
    }
}
