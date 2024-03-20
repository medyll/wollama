// db.js

import Dexie, { type Table } from 'dexie';
import type { DbChat, PromptType } from '$types/db';
import type { DBMessage } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';

import { stateIdbql, idbqBase } from '@medyll/idbql';
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

export const idbqModel = {
    chat: {
        keyPath: '&chatId, created_at, dateLastMessage' as unknown as DbChat,
        model: {} as DbChat,
    },
    messages: {
        keyPath: '++id, chatId, created_at',
        model: {} as DBMessage,
    },
    messageStats: {
        keyPath: '++id, chatId, created_at',
        model: {} as OllamaResponse,
    },
    prompts: {
        keyPath: '++id, created_at',
        model: {} as PromptType,
    },
    settings: {
        keyPath: '++id, userId',
        model: {} as SettingsType,
    },
    user: {
        keyPath: '++id, created_at, email',
        model: {} as UserType,
    },
} as const;

export const dbase = new DataBase();

// export const dbases = idbq('woolama_chatte');

/* let chat = dbstate.onCollection<DbChat>('chat');
let messages = dbstate.onCollection<DBMessage>('messages');
let messageStats = dbstate.onCollection<OllamaResponse>('messageStats');
let prompts = dbstate.onCollection<PromptType>('prompts');
let settings = dbstate.onCollection<SettingsType>('settings');
let user = dbstate.onCollection<UserType>('user'); */

/* export const idbqState = { chat, messages, messageStats, prompts, settings, user }; */
