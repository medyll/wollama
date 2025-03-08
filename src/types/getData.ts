import { invoke } from '@tauri-apps/api/core';

interface FieldSchema {
	type:      string;
	readonly?: boolean;
	private?:  boolean;
	required?: boolean;
}

interface ForeignKeySchema {
	code:     string;
	rules:    string[];
	multiple: boolean;
}

interface Template {
	index:        string;
	presentation: string[];
	fields:       Record<string, FieldSchema>;
	fks:          Record<string, ForeignKeySchema>;
}

interface TableSchema {
	keyPath:  string[];
	template: Template;
}

interface Schema {
	tables: Record<string, TableSchema>;
}

interface OperatorType {
	eq?:          any;
	gt?:          any;
	gte?:         any;
	lt?:          any;
	lte?:         any;
	ne?:          any;
	in?:          any[];
	nin?:         any[];
	contains?:    string;
	starts_with?: string;
	ends_with?:   string;
	btw?:         [any, any];
}

// table_name, action, data
interface GetDataParams<T> extends Record<string, unknown> {
	table_name: string;
	action:     'get_one' | 'getAll' | 'create' | 'delete' | 'update' | 'where' | 'updateWhere' | 'deleteWhere';
	data:       Record<string, any>;
}

async function getClientData<T>(params: GetDataParams<T>): Promise<any> {
	try {
		const result = await invoke('get_data', params);
		console.log('Get data result:', result);
	} catch (error) {
		console.error('Error getting data:', error);
	}
}

export {
	getClientData,
	type GetDataParams,
	type Schema,
	type TableSchema,
	type Template,
	type FieldSchema,
	type ForeignKeySchema,
	type OperatorType
};
