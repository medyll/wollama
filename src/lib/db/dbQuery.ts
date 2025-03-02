import type { DbChat, DBMessage, PromptType } from '$types/db';
import { OllamaChatMessageRole, type OllamaResponse } from '$types/ollama';
import { chatUtils } from '$lib/tools/chatUtils';
import { idbqlState, schemeModelDb } from './dbSchema';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';
import { schemeModel } from '$lib/db/dbSchema';
import { getClientData } from '$types/getData';
import type { Where } from '@medyll/idae-idbql';

export function ideo(collection: keyof typeof schemeModelDb) {
	if (!idbqlState[collection]) throw new Error(`Collection ${collection} not found`);
	return {
		get: getClientData({ table_name: collection, action: 'get_one', data: {} }),
		getAll: getClientData({
			table_name: collection,
			action: 'getAll',
			data: {}
		}),
		create: getClientData({
			table_name: collection,
			action: 'create',
			data: {}
		}),
		delete: getClientData({
			table_name: collection,
			action: 'delete',
			data: {}
		}),
		deleteWhere: getClientData({
			table_name: collection,
			action: 'deleteWhere',
			data: {}
		}),
		update: getClientData({
			table_name: collection,
			action: 'update',
			data: {}
		}),
		where: getClientData({ table_name: collection, action: 'where', data: {} }),
		updateWhere: getClientData({
			table_name: collection,
			action: 'updateWhere',
			data: {}
		})
	};
}
export function dynQuery(collection: keyof typeof schemeModelDb) {
	if (!idbqlState[collection]) throw new Error(`Collection ${collection} not found`);
	return {
		getOne: (id: any) => idbqlState[collection].getOne(id, schemeModel[collection].keyPath),
		getAll: () => idbqlState[collection].getAll(),
		create: (data) => idbqlState[collection].put(data),
		delete: (id: string | number) => idbqlState[collection].delete(id),
		deleteWhere: (data) => idbqlState[collection].deleteWhere(data),
		update: (id: any, data) => idbqlState[collection].update(id, data),
		where: (where: Where) => idbqlState[collection].where(where),
		updateWhere: (where: Where, data) => idbqlState[collection].updateWhere(where, data)
	};
}

export class idbQuery {
	/* chat */
	static getChat(id: number) {
		if (!id || !idbqlState?.chat) return undefined; // throw new Error('id is required');
		return idbqlState.chat.where({ id: { eq: id } })[0];
	}

	static getChats() {
		return idbqlState.chat.getAll();
	}

	static async insertChat(chatData?: Partial<DbChat>): Promise<DbChat> {
		let newChat = chatUtils.getChatDataObject();

		newChat = await idbqlState.chat.put({ ...newChat, ...chatData });
		return { ...newChat, ...chatData };
	}

	static async deleteChat(id?: number): Promise<number> {
		if (!id) throw new Error('id is required');

		await idbqlState.messages.deleteWhere({ id: { eq: id } });
		await idbqlState.chat.delete(id);

		return id;
	}

	static async updateChat(id: number, chatData: Partial<DbChat>) {
		if (!id) throw new Error('id is required');

		await idbqlState.chat.update(id, chatData);
		return { id, ...chatData };
	}

	static async initChat(id?: number, chatData: DbChat = {} as DbChat): Promise<DbChat> {
		if (Boolean(await idbQuery.getChat(id))) {
			await idbQuery.updateChat(id, chatData);
		}

		return id && Boolean(await idbQuery.getChat(id))
			? ((await idbQuery.getChat(id)) as DbChat)
			: ((await idbQuery.insertChat(chatData)) as DbChat);
	}

	/* Message */

	static async insertMessage(chatId: number, messageData: Partial<DBMessage>): Promise<DBMessage> {
		if (!chatId) throw new Error('chatId is required');
		const message = chatUtils.getMessageDataObject({ chatId, ...messageData });
		await idbqlState.messages.add(message);
		return message;
	}

	static async updateMessage(id: number, messageData: Partial<DBMessage>) {
		if (!id) throw new Error('id is required');
		await idbqlState.messages.update(id, { id, ...messageData });
	}

	static async updateMessageStream(id: number, data: Partial<OllamaResponse>) {
		if (!id) throw new Error('id is required');
		const message = await idbQuery.getMessage(id);

		let content = (message?.content ?? '') + (data?.message?.content ?? data?.response ?? '');

		if (content)
			await idbQuery.updateMessage(id, {
				content,
				status: 'streaming'
			});
	}

	static getMessage(id: number) {
		if (!id) throw new Error('id  is required');
		return idbqlState.messages.where({ id: { eq: id } })[0];
	}

	static getMessages(chatId: number): DBMessage | [] | any {
		if (!chatId) return [];
		return idbqlState.messages.where({ chatId: { eq: chatId } }).sortBy({ created_at: 'asc' });
	}

	static async getSystemMessage(chatId: number): Promise<DBMessage | undefined> {
		if (!chatId) throw new Error('chatId  is required');

		return await idbqlState.messages.where({
			chatId,
			role: OllamaChatMessageRole.SYSTEM
		})[0];
	}

	/* Prompt */
	static async getPrompt(promptId: string) {
		if (!promptId) throw new Error('promptId is required');
		return await idbqlState.prompts.where('id').equals(promptId).first();
	}

	static getPrompts() {
		return idbqlState.prompts.getAll();
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
