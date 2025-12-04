export type FieldType = 
    | 'string' 
    | 'number' 
    | 'boolean' 
    | 'date' 
    | 'timestamp' 
    | 'array' 
    | 'object' 
    | 'uuid'
    | 'email'
    | 'text-long';

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
}

export interface TableDefinition {
    primaryKey: string;
    indexes?: string[];
    fields: Record<string, FieldDefinition>;
    fk?: Record<string, { table: string; required?: boolean }>;
    template?: {
        presentation: string;
    };
}

export interface DatabaseSchema {
    [tableName: string]: TableDefinition;
}
