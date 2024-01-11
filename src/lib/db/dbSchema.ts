// db.js

import Dexie, { type Table } from 'dexie';
import type { ChatType, PromptType } from '$types/db';
import type { MessageType } from '$types/db';
import type { OllamaResponseType } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';

export class DataBase extends Dexie {
	chat!: Table<ChatType>;
	messages!: Table<MessageType>;
	messageStats!: Table<OllamaResponseType>;
	settings!: Table<SettingsType>;
	prompts!: Table<PromptType>;
	user!: Table<UserType>;

	constructor() {
		super('woolama');

		this.version(1.3).stores({
			chat: '&chatId, createdAt, dateLastMessage',
			messageStats: '&messageId, create_at',
			messages: '&messageId, chatId, createdAt',
			prompts: '++id, createdAt',
			settings: '++id,userId',
			user: '++id, createdAt, email'
		});
	}

	init() {}
}

export const dbase = new DataBase();
