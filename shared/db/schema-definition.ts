/** Value kinds a field can hold. Drives validation, the generated UI and the storage mapping. */
export type FieldType =
	'string' | 'number' | 'boolean' | 'date' | 'timestamp' | 'array' | 'object' | 'uuid' | 'email' | 'text-long';

/**
 * One column of a table. Beyond type and constraints it carries two optional
 * blocks: `ui` for how the generated form renders the field, and `ai` for fields
 * whose value a model fills in.
 */
export interface FieldDefinition {
	type: FieldType;
	required?: boolean;
	readonly?: boolean;
	private?: boolean;
	auto?: boolean;
	default?: any;
	maxLength?: number;
	enum?: string[];
	items?: FieldDefinition; // For arrays
	properties?: Record<string, FieldDefinition>; // For objects
	ui?: {
		type: string;
		[key: string]: any;
	};
	ai?: {
		model?: string;
		systemPrompt: string;
		trigger: 'manual' | 'auto_pre' | 'auto_post';
		outputMode?: 'replace' | 'append';
	};
}

/** One table: its key, its indexes, its fields, its foreign keys and how rows are presented. */
export interface TableDefinition {
	primaryKey: string;
	indexes?: string[];
	fields: Record<string, FieldDefinition>;
	fk?: Record<string, { table: string; required?: boolean; multiple?: boolean }>;
	template?: {
		presentation: string;
		card_lines?: string[];
		table_columns?: string[];
	};
}

/** The whole schema, keyed by table name. */
export interface DatabaseSchema {
	[tableName: string]: TableDefinition;
}
