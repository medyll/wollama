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
		
		this.version(0.2).stores({
			chat: '++id, chatId, title, models, messages, dateCreation, dateLastMessage, context',
			messages: '++id, chatId, messageId, edit, editedContent, content, role, context, data',
			messageStats:
				'++id, messageId, model, create_at, response, done, context, created_at, eval_count, eval_duration, load_duration, prompt_eval_count, prompt_eval_duration, total_duration'
		});
	}

	init() {
	}
}

export const dbase = new DataBase();
