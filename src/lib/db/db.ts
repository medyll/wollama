// db.js

import Dexie, { type Table } from 'dexie';
import type { ChatDataType } from '../stores/chatter';
import type { MessageType } from '../stores/messages';
import type { OllamaStreamLine } from '../tools/ollamaFetch';

export class DataBase extends Dexie {
	chat!: Table<ChatDataType>;
	messages!: Table<MessageType>;
	messageStats!: Table<OllamaStreamLine>;

	constructor() {
		super('woolama');

		this.version(0.8).stores({
			chat: '&chatId, dateCreation, dateLastMessage',
			messages: '&messageId, chatId, dateCreation',
			messageStats:'&messageId, create_at'
		});

		// console.log(this.messages);
		//alert(this.messages.schema.primKey.keyPath)
	}

	init() {}
}

export const dbase = new DataBase();
