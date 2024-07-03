import type { DBAgent, DbAgentOf, DbAgentPrompt, DbCategory, DbChat, DbTags, PromptType } from '$types/db';
import type { DBMessage } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';
import { createIdbqDb, type IdbqModel, type Tpl } from '@medyll/idbql';

export const schemeModel: IdbqModel = {
    agent: {
        keyPath: '++id, promptId, created_at',
        model: {} as DBAgent,
        ts: {} as DBAgent,
        template: {
            index: 'id',
            presentation: 'name model',
            fields: {
                id: 'id (readonly)',
                name: 'text (private)',
                code: 'text',
                model: 'text',
                prompt: 'text-long',
                created_at: 'date (private)',
                ia_lock: 'boolean (private)',
                agentPromptId: 'fk-agentPrompt.id (required)',
            },
            fks: {
                agentPrompt: {
                    code: 'agentPrompt',
                    rules: 'readonly private',
                    multiple: true,
                },
            },
        },
    },
    agentPrompt: {
        keyPath: '++id, created_at',
        model: {} as DbAgentPrompt,
        ts: {} as DbAgentPrompt,
        template: {
            index: 'id',
            presentation: 'name',
            fields: {
                id: 'id (readonly)',
                created_at: 'date (private)',
                value: 'text-long (required)',
                name: 'text (required)',
                code: 'text (required)',
                ia_lock: 'boolean (private)',
            },
            fks: {},
        },
    },
    agentOf: {
        keyPath: '++id, created_at',
        model: {} as DbAgentOf,
        ts: {} as DbAgentOf,
        template: {
            index: 'id',
            presentation: 'name',
            fields: {
                code: 'text',
                name: 'text',
                context: 'array-of-number',
            },
            fks: {},
        },
    },
    chat: {
        keyPath: '&chatId, createdAt, category, categoryId, dateLastMessage',
        model: {} as DbChat,
        ts: {} as DbChat,
        template: {
            index: 'chatId',
            fields: {
                chatId: 'id',
                createdAt: 'date',
                category: 'text',
                categoryId: 'id',
                dateLastMessage: 'date',
                name: 'text',
                description: 'text',
                ia_lock: 'boolean',
            },
            fks: {},
        },
    },
    category: {
        keyPath: '++id, code',
        model: {} as DbCategory,
        ts: {} as DbCategory,
        template: {
            index: 'id',
            fields: {
                id: 'id',
                code: 'text',
                name: 'text',
                ia_lock: 'boolean (private)',
            },
            fks: {},
        },
    },
    tags: {
        keyPath: '++id, code',
        model: {} as DbTags,
        ts: {} as DbTags,
        template: {
            index: 'id',
            presentation: 'name',
            fields: {
                id: 'id',
                code: 'text',
                name: 'text',
                ia_lock: 'boolean (private)',
            },
            fks: {},
        },
    },
    messages: {
        keyPath: '&messageId, chatId, created_at',
        model: {} as DBMessage,
        ts: {} as DBMessage,
        template: {
            index: 'messageId',
            presentation: 'resume',
            fields: {
                id: 'id',
                chatId: 'id',
                created_at: 'date',
                content: 'text-long',
                status: 'text',
                context: 'array-of-number',
                resume: 'text',
                model: 'text',
                ia_lock: 'boolean',
            },
            fks: {},
        },
    },
    messageStats: {
        keyPath: '++id, chatId, created_at',
        model: {} as OllamaResponse,
        ts: {} as OllamaResponse,
    },
    prompts: {
        keyPath: '++id, created_at',
        model: {} as PromptType,
        ts: {} as PromptType,
        template: {
            index: 'id',
            presentation: 'name',
            fields: {
                id: 'id',
                name: 'text',
                code: 'text',
                value: 'text',
                created_at: 'date',
                ia_lock: 'boolean',
            },
            fks: {},
        },
    },
    settings: {
        keyPath: '++id, userId',
        model: {} as SettingsType,
        ts: {} as SettingsType,
        template: {
            index: 'id',
            presentation: 'code',
            fields: {
                id: 'id',
                userId: 'id',
                created_at: 'date (readonly)',
                updated_at: 'date (readonly)',
                code: 'text',
                value: 'text',
                ia_lock: 'boolean (private)',
            },
            fks: {},
        },
    },
    user: {
        keyPath: '++id, created_at, email',
        model: {} as UserType,
        ts: {} as UserType,
        template: {
            index: 'id',
            presentation: 'email',
            fields: {
                id: 'id',
                name: 'text',
                color: 'text',
                created_at: 'date (readonly)',
                email: 'email',
                password: 'password',
                ia_lock: 'boolean (private)',
            },
            fks: {},
        },
    },
} as const;

//type test = DbTemplateModel<typeof idbqModel>;
const idbqStore = createIdbqDb<typeof schemeModel>(schemeModel, 10);
export const { idbql, idbqlState, idbDatabase, idbqModel } = idbqStore.create('woolama');

//idbql.agent.where({ $eq: { id: 3 } });
