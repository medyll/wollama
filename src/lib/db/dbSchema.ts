import type {
    DbCharacterLink,
    DBAgent,
    DbAgentOf,
    DbAgentPrompt,
    DbBook,
    DbBookPrompts,
    DbCategory,
    DbChapter,
    DbCharacter,
    DbCharacterChapterStatus,
    DbChat,
    DbTags,
    DbWritingGoal,
    PromptType,
} from '$types/db';
import type { DBMessage } from '$types/db';
import type { OllamaResponse } from '$types/ollama';
import type { SettingsType } from '$types/settings';
import type { UserType } from '$types/user';
import { createIdbqDb, type IdbqModel, type Tpl, type DbFieldTypes, type TplFieldType } from '@medyll/idbql';

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
            presentation: 'name',
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
    // Nouvelles entités pour le Book Creator Helper
    book: {
        keyPath: '++id, userId, created_at',
        model: {} as DbBook,
        ts: {} as DbBook,
        template: {
            index: 'id',
            presentation: 'title',
            fields: {
                id: 'id (readonly)',
                userId: 'id',
                title: 'text-long (required)',
                description: 'text-area',
                created_at: 'date (readonly)',
                updated_at: 'date',
                status: 'text',
                ia_lock: 'boolean (private)',
            },
            fks: {
                user: {
                    code: 'user',
                    multiple: false,
                    rules: 'readonly',
                },
            },
        },
    },

    chapter: {
        keyPath: '++id, bookId, order',
        model: {} as DbChapter,
        ts: {} as DbChapter,
        template: {
            index: 'id',
            presentation: 'title',
            fields: {
                id: 'id (readonly)',
                bookId: 'id',
                title: 'text-long (required)',
                content: 'text-area',
                order: 'number',
                created_at: 'date (readonly)',
                updated_at: 'date',
                ia_lock: 'boolean (private readonly)',
            },
            fks: {
                book: {
                    code: 'book',
                    multiple: false,
                    rules: 'readonly',
                },
            },
        },
    },

    writingGoal: {
        keyPath: '++id, userId, bookId',
        model: {} as DbWritingGoal,
        ts: {} as DbWritingGoal,
        template: {
            index: 'id',
            presentation: 'description',
            fields: {
                id: 'id (readonly)',
                userId: 'id',
                bookId: 'id',
                description: 'text (required)',
                targetWordCount: 'number',
                deadline: 'date',
                created_at: 'date (readonly)',
                updated_at: 'date',
                ia_lock: 'boolean (private)',
            },
            fks: {
                user: {
                    code: 'user',
                    multiple: false,
                    rules: 'readonly',
                },
                book: {
                    code: 'book',
                    multiple: false,
                    rules: 'readonly',
                },
            },
        },
    },

    character: {
        keyPath: '++id, bookId',
        model: {} as DbCharacter,
        ts: {} as DbCharacter,
        template: {
            index: 'id',
            presentation: 'firstName lastName',
            fields: {
                id: 'id (readonly)',
                bookId: 'id',
                characterLinkId: 'array-of-fk-characterLink.id',
                firstName: 'text (required)',
                lastName: 'text',
                nickname: 'text',
                role: 'text',
                description: 'text-area',
                backstory: 'text-area',
                age: 'number',
                gender: 'text',
                occupation: 'text',
                physicalDescription: 'text-area',
                personalityTraits: 'array-of-text',
                goals: 'text-area',
                conflicts: 'text-area',
                created_at: 'date (readonly)',
                updated_at: 'date',
                ia_lock: 'boolean (private)',
            },
            fks: {
                book: {
                    code: 'book',
                    multiple: false,
                    rules: 'readonly',
                },
                characterLink: {
                    code: 'characterLink',
                    multiple: true,
                    rules: '',
                },
            },
        },
    },
    characterLink: {
        keyPath: '++id',
        model: {} as DbCharacterLink,
        ts: {} as DbCharacterLink,
        template: {
            index: 'id',
            presentation: 'type',
            fields: {
                id: 'id',
                characterId: 'array-of-fk-character.id',
                type: 'text-short',
                description: 'text-medium',
                active: 'boolean',
            },
            fks: {
                character: {
                    code: 'character',
                    multiple: true,
                    rules: '',
                },
            },
        },
    },
    characterChapterStatus: {
        keyPath: '++id, characterId, chapterId',
        model: {} as DbCharacterChapterStatus,
        ts: {} as DbCharacterChapterStatus,
        template: {
            index: 'id',
            presentation: 'characterId chapterId status',
            fields: {
                id: 'id (readonly)',
                characterId: 'id',
                chapterId: 'id',
                status: 'text',
                role: 'text',
                actions: 'text-long',
                development: 'text-area',
                notes: 'text-long',
                created_at: 'date (readonly)',
                updated_at: 'date',
            },
            fks: {
                character: {
                    code: 'character',
                    multiple: false,
                    rules: 'readonly',
                },
                chapter: {
                    code: 'chapter',
                    multiple: false,
                    rules: 'readonly',
                },
            },
        },
    },

    bookPrompts: {
        keyPath: '++id, bookId',
        model: {} as DbBookPrompts,
        ts: {} as DbBookPrompts,
        template: {
            index: 'id',
            presentation: 'name',
            fields: {
                id: 'id (readonly)',
                bookId: 'id',
                name: 'text (required)',
                category: 'text',
                content: 'text-area',
                created_at: 'date (readonly)',
                updated_at: 'date',
                ia_lock: 'boolean (private)',
            },
            fks: {
                book: {
                    code: 'book',
                    multiple: false,
                    rules: 'readonly',
                },
            },
        },
    },
} as const;

//type test = DbTemplateModel<typeof idbqModel>;
const idbqStore = createIdbqDb<typeof schemeModel>(schemeModel, 12);
export const { idbql, idbqlState, idbDatabase, idbqModel } = idbqStore.create('woolama');

// idbql.agent.where({ $eq: { id: 3 } });
