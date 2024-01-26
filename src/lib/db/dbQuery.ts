import type { DbChat, DBMessage, PromptType } from '$types/db';
import type { OllResponseType } from '$types/ollama';
import { chatUtils } from '$lib/tools/chatUtils';
import { dbase } from './dbSchema';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';

export class idbQuery {
    static get(collection: keyof typeof dbase, id: any) {
        const collectionId = `${collection}Id`;
    }
    static async getAll(collection: keyof typeof dbase) {}
    static async update(collection: keyof typeof dbase, values: any) {}
    static async insert(collection: keyof typeof dbase, values: any) {}
    static async delete(collection: keyof typeof dbase, id: any) {
        const collectionId = `${collection}Id`;
    }

    /* chat */
    static async getChat(chatId: string) {
        if (!chatId) return undefined; // throw new Error('chatId is required');
        return await dbase.chat.where('chatId').equals(chatId).first();
    }

    static async getChats() {
        return await dbase.chat.toArray();
    }

    static async insertChat(chatData?: DbChat): Promise<DbChat> {
        const newChat = chatUtils.getChatDataObject();
        await dbase.chat.add({ ...newChat, ...chatData });
        return { ...newChat, ...chatData };
    }

    static async deleteChat(chatId?: string): Promise<string> {
        if (!chatId) throw new Error('chatId is required');
        await dbase.chat.delete(chatId);
        const messages = await idbQuery.getMessages(chatId);
        dbase.messages.bulkDelete(messages.map((e) => e.messageId));
        return chatId;
    }

    static async updateChat(chatId: string, chatData: Partial<DbChat>) {
        if (!chatId) throw new Error('chatId is required');

        await dbase.chat.update(chatId, chatData);
    }

    static async initChat(activeChatId?: string, chatData: DbChat = {} as DbChat): Promise<DbChat> {
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

        await dbase.messages.add(message as DBMessage);

        return message;
    }

    static async updateMessage(messageId: string, messageData: Partial<DBMessage>) {
        if (!messageId) throw new Error('messageId is required');

        await dbase.messages.update(messageId, { messageId, ...messageData });
    }

    static async updateMessageStream(messageId: string, data: Partial<OllResponseType>) {
        if (!messageId) throw new Error('messageId is required');
        const message = await idbQuery.getMessage(messageId);
        await idbQuery.updateMessage(messageId, {
            content: (message?.content ?? '') + (data?.response ?? data?.message?.content ?? ''),
            status: 'streaming',
        });
    }

    static async getMessage(messageId: string) {
        if (!messageId) throw new Error('chatId is required');
        return await dbase.messages.where('messageId').equals(messageId).first();
    }

    static getMessages(chatId: string) {
        if (!chatId) throw new Error('chatId is required');
        return dbase.messages
            .where('chatId')
            .equals(chatId)
            .sortBy('createdAt')
            .then((messages) => messages.map((e) => e));
    }
    /* MessageStats */
    static async insertMessageStats(statsData: Partial<OllResponseType>) {
        if (!statsData.messageId) throw new Error('messageId is required');
        const stats = chatUtils.getMessageStatsObject(statsData);
        await dbase.messageStats.add(stats);
    }
    /* Prompt */
    static async getPrompt(promptId: string) {
        if (!promptId) throw new Error('promptId is required');
        return await dbase.prompts.where('id').equals(promptId).first();
    }

    static async getPrompts() {
        return await dbase.prompts.toArray();
    }

    static async insertPrompt(promptData: Partial<PromptType>) {
        return await dbase.prompts.put(promptData as PromptType);
    }

    static async updatePrompt(id: number, promptData: Partial<PromptType>) {
        if (!id) throw new Error('id is required');
        return await dbase.prompts.update(id, promptData);
    }

    static async deletePrompt(promptId: number) {
        if (!promptId) throw new Error('promptId is required');
        return await dbase.prompts.delete(promptId);
    }
    /* Settings */
    static async getSettings() {
        return await dbase.settings.toArray();
    }
    static async insertSettings(settingsData: Partial<SettingsType>) {
        return await dbase.settings.put(settingsData as SettingsType);
    }
    static async updateSettings(id: number, settingsData: Partial<SettingsType>) {
        if (!id) throw new Error('id is required');
        return await dbase.settings.update(id, settingsData);
    }
    static async deleteSettings(id: number) {
        if (!id) throw new Error('id is required');
        return await dbase.settings.delete(id);
    }

    /* User */
    static async getUser(id: number) {
        if (!id) throw new Error('id is required');
        return await dbase.user.where('id').equals(id).first();
    }

    static async getUsers() {
        return await dbase.user.toArray();
    }

    static async insertUser(userData: Partial<UserType>) {
        return await dbase.user.put(userData as UserType);
    }

    static async updateUser(id: number, userData: Partial<UserType>) {
        if (!id) throw new Error('id is required');
        return await dbase.user.update(id, userData);
    }

    static async deleteUser(id: number) {
        if (!id) throw new Error('id is required');
        return await dbase.user.delete(id);
    }
}
