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

		this.version(1.1).stores({
			chat: '&chatId, dateCreation, dateLastMessage',
			messages: '&messageId, chatId, dateCreation',
			messageStats: '&messageId, create_at',
			settings: '++id',
			prompts: '++id, dateCreation',
			user: '++id, created_at, email',
		});
	}

	init() {}
}

export const dbase = new DataBase();
