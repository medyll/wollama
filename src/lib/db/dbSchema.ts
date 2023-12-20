// db.js

import Dexie, { type Table } from 'dexie';
import type { ChatType } from '$types/db';
import type { MessageType } from '$types/db';
import type { OllamaResponseType } from '$types/ollama';
import { IndexedDBWrapper, Table2 } from '$lib/external/indexed.js';
import type { SettingsType } from '$types/settings';

export class DataBase extends Dexie {
	chat!: Table<ChatType>;
	messages!: Table<MessageType>;
	messageStats!: Table<OllamaResponseType>;
	settings!: Table<SettingsType>;

	constructor() {
		super('woolama');

		this.version(0.8).stores({
			chat: '&chatId, dateCreation, dateLastMessage',
			messages: '&messageId, chatId, dateCreation',
			messageStats:'&messageId, create_at',
			settings:'++id',
		});
	}

	init() {}
}

export const dbase = new DataBase();

export class DataBas2e extends IndexedDBWrapper {
	chat!: Table2<ChatType>;
	messages!: Table2<MessageType>;
	messageStats!: Table<OllamaResponseType>;

	constructor() {
		super('woolamaself');

		this.version(11).stores({
			chat: '&chatId, dateCreation, dateLastMessage',
			messages: '&messageId, chatId, dateCreation',
			messageStats: '&messageId, create_at'
		});
	}
}

export const dbase2 = new DataBas2e();