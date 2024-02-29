// db.js

import Dexie, { type Table } from 'dexie';
import type { DbChat, PromptType } from '$types/db';
import type { DBMessage } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';

export class DataBase extends Dexie {
    chat!: Table<DbChat>;
    messages!: Table<DBMessage>;
    messageStats!: Table<OllamaResponse>;
    settings!: Table<SettingsType>;
    prompts!: Table<PromptType>;
    user!: Table<UserType>;

    constructor() {
        super('woolama');

        this.version(1.4).stores({
            chat: '&chatId, createdAt, dateLastMessage',
            messageStats: '&messageId, create_at',
            messages: '&messageId, chatId, createdAt',
            prompts: '++id, createdAt',
            settings: '++id,userId',
            user: '++id, createdAt, email',
        });
    }

    init() {}
}

export const dbase = new DataBase();
