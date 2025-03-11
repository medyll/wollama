import type { DbChat, DBMessage, PromptType } from '$types/db';
import { type OllamaResponse } from '$types/ollama';
import { dataUtils } from '$lib/tools/chatUtils';
import { idbql, idbqlState, schemeModelDb } from './dbSchema';
import type { UserType } from '$types/user';
import { getClientData } from '$types/getData';

export function ideo(collection: keyof typeof schemeModelDb) {
	if (!idbqlState[collection]) throw new Error(`Collection ${collection} not found`);
	return {
		get:         getClientData({ table_name: collection, action: 'get_one', data: {} }),
		getAll:      getClientData({
			table_name: collection,
			action:     'getAll',
			data:       {}
		}),
		create:      getClientData({
			table_name: collection,
			action:     'create',
			data:       {}
		}),
		delete:      getClientData({
			table_name: collection,
			action:     'delete',
			data:       {}
		}),
		deleteWhere: getClientData({
			table_name: collection,
			action:     'deleteWhere',
			data:       {}
		}),
		update:      getClientData({
			table_name: collection,
			action:     'update',
			data:       {}
		}),
		where:       getClientData({ table_name: collection, action: 'where', data: {} }),
		updateWhere: getClientData({
			table_name: collection,
			action:     'updateWhere',
			data:       {}
		})
	};
}

export function qoolie(collection: keyof typeof schemeModelDb) {
	// if (!idbqlState[collection]) throw new Error(`Collection ${collection} not found`);
	console.log({ idbqlState });
	return {
		get:         idbqlState?.[collection]?.get,
		getBy:       idbqlState?.[collection]?.getBy,
		getOne:      idbqlState?.[collection]?.getOne,
		getAll:      idbqlState?.[collection]?.getAll,
		create:      idbqlState?.[collection]?.put,
		delete:      idbqlState?.[collection]?.delete,
		deleteWhere: idbqlState?.[collection]?.deleteWhere,
		update:      idbqlState?.[collection]?.update,
		where:       idbqlState?.[collection]?.where,
		updateWhere: idbqlState?.[collection]?.updateWhere
	};
}

export class idbQuery {
	static async getChatByPassKey(chatPassKey: string) {
		if (!chatPassKey || !idbqlState?.chat) return undefined; // throw new Error('id is required');

		const ret = await idbql.chat.where({ chatPassKey: { eq: chatPassKey } });

		return ret[0];
	}

	static async insertChat(chatData?: Partial<DbChat>): Promise<DbChat> {
		let newChat = dataUtils.getChatDataObject();

		newChat = await idbqlState.chat.put({ ...newChat, ...chatData }); // dbQuery('chat').create({ ...newChat, ...chatData }); //
		return { ...newChat, ...chatData };
	}

	static async deleteChat(id?: number): Promise<number> {
		if (!id) throw new Error('id is required');

		await idbql.messages.deleteWhere({ chatId: { eq: id } });
		await idbql.chat.delete(id);

		return id;
	}

	static async updateChat(id: number, chatData: Partial<DbChat>) {
		if (!id) throw new Error('id is required');

		await idbqlState.chat.update(id, chatData);
		return { id, ...chatData };
	}

	static async initChat(id?: number, chatData: DbChat = {} as DbChat): Promise<DbChat> {
		if (id && (await qoolie('chat').getOne(id))) {
			await idbQuery.updateChat(id, chatData);
		}

		return id && Boolean(await qoolie('chat').getOne(id))
			? ((await qoolie('chat').getOne(id)) as DbChat)
			: ((await idbQuery.insertChat(chatData)) as DbChat);
	}

	/* Message */

	static async insertMessage(chatId: number, messageData: Partial<DBMessage>): Promise<DBMessage> {
		if (!chatId) throw new Error('chatId is required');
		const message = dataUtils.getMessageDataObject({ chatId, ...messageData });
		return await idbqlState.messages.add(message);
	}

	static async updateMessage(id: number, messageData: Partial<DBMessage>) {
		if (!id) throw new Error('id is required');
		await idbqlState.messages.update(id, { id, ...messageData });
	}

	static async updateMessageStream(id: number, data: Partial<OllamaResponse>) {
		if (!id) throw new Error('id is required');
		const message = await qoolie('messages').getOne(id);

		const content = (message?.content ?? '') + (data?.message?.content ?? data?.response ?? '');

		if (content) {
			await idbQuery.updateMessage(id, {
				content,
				status: 'streaming'
			});
		}
	}

	/* Prompt */
	static async getPrompt(promptId: string) {
		if (!promptId) throw new Error('promptId is required');
		return await idbqlState.prompts.get(promptId); //.equals(promptId).first();
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

	/* User */

	static async getUsers() {
		return await idbqlState.user.getAll();
	}

	static async insertUser(userData: Partial<UserType>) {
		return await idbqlState.user.put(userData as UserType);
	}
}
