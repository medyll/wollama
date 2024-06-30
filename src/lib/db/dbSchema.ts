import type { DbCategory, DbChat, DbTags, PromptType } from '$types/db';
import type { DBMessage } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';
import { createIdbqDb } from '@medyll/idbql';

export const idbqModel = {
    chat: {
        keyPath: '&chatId, createdAt, category, categoryId, dateLastMessage',
        model: {} as DbChat,
    },
    category: {
        keyPath: '++id, code',
        model: {} as DbCategory,
    },
    tags: {
        keyPath: '++id, code',
        model: {} as DbTags,
    },
    messages: {
        keyPath: '&messageId, chatId, created_at',
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

const idbqStore = createIdbqDb<typeof idbqModel>(idbqModel, 7);
export const { idbql, idbqlState, idbDatabase } = idbqStore.create('woolama');
