export type DbDataModel<T = Record<string, CollectionDbModel>> = {
	readonly [K in keyof T]: CollectionDbModel<T[K]>;
};

export interface CollectionDbModel<T = Record<string, any>> {
	keyPath:   string | any;
	ts:        any;
	model:     any;
	template?: {
		index:        string;
		presentation: any;
		fields?:      {};
		fks?:         {
			code:     string;
			multiple: boolean;
			rules:    string;
		};
	};
}

export type DbDataModelTs<T extends Record<string, { ts: any }> = DbDataModel> = {
	[K in keyof T]: T[K]['ts'];
};

interface agentType {
	id: string;
}
interface agentPromptType {
	id: string;
}

const monModel = {
	agent:       {
		keyPath:  '++id, promptId, created_at',
		ts:       {} as agentType,
		model:    {} as agentType,
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
			}
		}
	},
	agentPrompt: {
		keyPath:  '++id, created_at',
		ts:       {} as agentPromptType,
		model:    {} as agentPromptType,
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
			}
		}
	}
} satisfies DbDataModel;

//
