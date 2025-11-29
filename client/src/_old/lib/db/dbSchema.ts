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
	DbSpaces
} from '../../types/db';
import type { DBMessage } from '../../types/db';
import type { SettingsType } from '../../types/settings';
import type { UserType } from '../../types/user';
import { createIdbqDb, type IdbqModel, type Tpl, type DbFieldTypes, type TplFieldType } from '@medyll/idae-idbql';
import { space } from 'postcss/lib/list';
import type { DbDataModel, DbDataModelTs } from './dataModel';

export const schemeModelDb = {
	agent:                  {
		keyPath:  '++id, promptId, created_at',
		model:    {} as DBAgent,
		ts:       {} as DBAgent,
		template: {
			index:        'id',
			presentation: 'name model',
			fields:       {
				id:            'id (readonly)',
				name:          'text (private)',
				code:          'text',
				model:         'text',
				prompt:        'text-long',
				created_at:    'date (private)',
				ia_lock:       'boolean (private)',
				agentPromptId: 'fk-agentPrompt.id (required)'
			},
			fks:          {
				agentPrompt: {
					code:     'agentPrompt',
					rules:    'readonly private',
					multiple: true
				}
			}
		}
	},
	agentPrompt:            {
		keyPath:  '++id, created_at',
		model:    {} as DbAgentPrompt,
		ts:       {} as DbAgentPrompt,
		template: {
			index:        'id',
			presentation: 'name',
			fields:       {
				id:         'id (readonly)',
				created_at: 'date (private)',
				value:      'text-long (required)',
				name:       'text (required)',
				code:       'text (required)',
				ia_lock:    'boolean (private)'
			},
			fks:          {}
		}
	},
	chat:                   {
		keyPath:  '++id, &chatId, &chatPassKey, created_at, category, categoryId, dateLastMessage',
		model:    {} as DbChat,
		ts:       {} as DbChat,
		template: {
			index:        'id',
			presentation: 'title',
			fields:       {
				id:              'id',
				chatId:          'id (private)',
				chatPassKey:     'id (private)',
				title:           'text',
				created_at:      'timestamp (readonly)',
				category:        'text',
				categoryId:      'id',
				dateLastMessage: 'date',
				description:     'text',
				ia_lock:         'boolean',
				spaceId:         'fk-space.id (required)'
			},
			fks:          {
				space: {
					code:     'space',
					rules:    'private required',
					multiple: false
				}
			}
		}
	},
	category:               {
		keyPath:  '++id, code',
		model:    {} as DbCategory,
		ts:       {} as DbCategory,
		template: {
			index:        'id',
			presentation: 'name',
			fields:       {
				id:      'id',
				code:    'text',
				name:    'text',
				ia_lock: 'boolean (private)'
			},
			fks:          {}
		}
	},
	space:                  {
		keyPath:  '++id, code',
		model:    {} as DbSpaces,
		ts:       {} as DbSpaces,
		template: {
			index:        'id',
			presentation: 'name',
			fields:       {
				id:         'id',
				modelId:    'id',
				name:       'text',
				caption:    'text-long',
				prompt:     'text-area',
				created_at: 'timestamp',
				ia_lock:    'boolean'
			},
			fks:          {
				model: {
					code:     'model',
					rules:    'required private',
					multiple: false
				}
			}
		}
	},
	tags:                   {
		keyPath:  '++id, code',
		model:    {} as DbTags,
		ts:       {} as DbTags,
		template: {
			index:        'id',
			presentation: 'name',
			fields:       {
				id:      'id',
				code:    'text',
				name:    'text',
				ia_lock: 'boolean (private)'
			},
			fks:          {}
		}
	},
	messages:               {
		keyPath:  '++id, messageId, chatId, created_at',
		model:    {} as DBMessage,
		ts:       {} as DBMessage,
		template: {
			index:        'id',
			presentation: 'id resume',
			fields:       {
				id:         'id',
				chatId:     'fk-chat.id',
				messageId:  'id',
				created_at: 'date',
				content:    'text-long',
				status:     'text',
				context:    'array-of-number',
				resume:     'text',
				model:      'text',
				ia_lock:    'boolean'
			},
			fks:          {
				chat: {
					code:     'chat',
					rules:    'readonly private',
					multiple: false
				}
			}
		}
	},
	prompts:                {
		keyPath:  '++id, created_at',
		model:    {} as PromptType,
		ts:       {} as PromptType,
		template: {
			index:        'id',
			presentation: 'name',
			fields:       {
				id:         'id (private)',
				code:       'text-tiny',
				name:       'text-medium',
				value:      'text-area',
				created_at: 'date (private)',
				ia_lock:    'boolean'
			},
			fks:          {}
		}
	},
	settings:               {
		keyPath:  '++id, userId',
		model:    {} as SettingsType,
		ts:       {} as SettingsType,
		template: {
			index:        'id',
			presentation: 'code',
			fields:       {
				id:         'id',
				userId:     'id',
				created_at: 'date (readonly)',
				updated_at: 'date (readonly)',
				code:       'text',
				value:      'text',
				ia_lock:    'boolean (private)'
			},
			fks:          {}
		}
	},
	user:                   {
		keyPath:  '++id, created_at, email',
		model:    {} as UserType,
		ts:       {} as UserType,
		template: {
			index:        'id',
			presentation: 'email',
			fields:       {
				id:         'id',
				name:       'text',
				color:      'text',
				created_at: 'date (readonly)',
				email:      'email',
				password:   'password',
				ia_lock:    'boolean (private)'
			},
			fks:          {}
		}
	},
	 
} satisfies DbDataModel;

export const schemeModel: IdbqModel = {
	...schemeModelDb
} as unknown as IdbqModel<typeof schemeModelDb>;

export type DataModelFinal = DbDataModelTs<typeof schemeModelDb>;

const idbqStore = createIdbqDb<typeof schemeModel>(schemeModel, 1);
export const { idbql, idbqlState, idbDatabase, idbqModel } = idbqStore.create('woolama');
