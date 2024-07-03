import type { CollectionModel, IdbqModel, TplCollectionName, Tpl, TplFields } from '@medyll/idbql';
import { schemeModel } from './dbSchema';

export enum enumPrimitive {
    id = 'id',
    any = 'any',
    date = 'date',
    text = 'text',
    number = 'number',
    boolean = 'boolean',
    datetime = 'datetime',
    url = 'url',
    email = 'email',
    phone = 'phone',
    time = 'time',
    password = 'password',
}

export enum TplProperties {
    'private' = 'private',
    'readonly' = 'readonly',
    'required' = 'required',
}

type CombineElements<T extends string, U extends string = T> = T extends any ? T | `${T} ${CombineElements<Exclude<U, T>>}` : never;
type CombinedArgs = CombineElements<TplProperties>;

type IdbObjectify<T extends string = 'number'> = `array-of-${T}` | `object-${T}`;

// make a method parse primitive types
export type IdDbPrimitive<T = {}> =
    | keyof typeof enumPrimitive
    | `text-${'tiny' | 'short' | 'medium' | 'long' | 'giant'}`
    | `${string}.${string}`
    | `fk-${string}.${string}`;

export type IDbObjectPrimitive = IdbObjectify<IdDbPrimitive>;
export type IDbFk = `fk-${string}.${string}`;
export type IDbFkObject = IdbObjectify<IDbFk>;
export type IDbTypes = IdDbPrimitive | IDbObjectPrimitive | IDbFk | IDbFkObject;

export type IDBArgumentsTypes = `${IDbTypes}(${CombinedArgs})`;
const a: IDBArgumentsTypes = 'any(private required readonly)';
// final types all together
export type IDbFieldRules = IDBArgumentsTypes | IDbTypes;
export type IDbFieldType = IDBArgumentsTypes | IDbTypes;

export type IDbForge = {
    collection?: TplCollectionName;
    fieldName?: keyof TplFields;
    fieldType?: IDbFieldType;
    fieldRule?: IDbFieldRules;
    fieldArgs?: [keyof typeof TplProperties] | undefined;
    is: any;
};

export class IDbFields<T = Record<string, any>> {
    model: IdbqModel = schemeModel;

    constructor(model?: IdbqModel) {
        this.model = model ?? this.model;
    }

    parseAllCollections() {
        let out: Record<string, Record<string, IDbForge | undefined> | undefined> = {};
        Object.keys(this.#getModel()).forEach((collection) => {
            out[collection] = this.parseRawCollection(collection as TplCollectionName);
        });

        return out;
    }

    parseRawCollection(collection: TplCollectionName): Record<string, IDbForge | undefined> | undefined {
        const fields = this.getTemplateFields(collection);
        if (!fields) return;
        let out: Record<string, IDbForge | undefined> = {};

        Object.keys(fields).forEach((fieldName) => {
            let fieldType = fields[fieldName];
            if (fieldType) {
                out[fieldName] = this.parseCollectionFieldName(collection, fieldName);
            }
        });

        return out;
    }

    parseCollectionFieldName(collection: TplCollectionName, fieldName: keyof TplFields) {
        const field = this.getTemplateFieldRule(collection, fieldName);
        if (!field) return;
        let fieldType = this.testIs('primitive', field) ?? this.testIs('array', field) ?? this.testIs('object', field) ?? this.testIs('fk', field);

        return this.forge({ collection, fieldName, ...fieldType });
    }

    parsFieldRule(fieldRule: IDbFieldRules) {
        if (!fieldRule) return;
        let fieldType =
            this.testIs('primitive', fieldRule) ?? this.testIs('array', fieldRule) ?? this.testIs('object', fieldRule) ?? this.testIs('fk', fieldRule);

        return undefined;
    }

    forge({ collection, fieldName, fieldType, fieldRule, fieldArgs, is }: IDbForge): IDbForge {
        return {
            collection,
            fieldName,
            fieldType,
            fieldRule,
            fieldArgs,
            is,
        };
    }

    #getModel() {
        return this.model;
    }

    getCollection(collection: TplCollectionName) {
        return this.#getModel()[String(collection)] as CollectionModel;
    }
    getTemplate(collection: TplCollectionName) {
        return this.getCollection(collection)['template'] as Tpl;
    }
    getIndexName(collection: string) {
        return this.getCollection(collection)?.template?.index;
    }
    getTemplateFields(collection: TplCollectionName) {
        return this.getTemplate(collection)?.fields as TplFields;
    }
    getTemplatePresentation(collection: TplCollectionName) {
        return this.getTemplate(collection)?.presentation as string;
    }
    getTemplateFieldRule(collection: TplCollectionName, fieldName: keyof TplFields) {
        return this.getTemplateFields(collection)?.[String(fieldName)] as IDbFieldRules | undefined;
    }

    getFieldArgs(string: IDbFieldRules) {}

    extractFieldArgs(string: IDbFieldRules) {}

    getFkFieldType(string: `${string}.${string}`) {
        const [collection, field] = string.split('.') as [string, string];
        let template = this.getTemplateFieldRule(collection, field as any);

        return template as IDbFieldRules | undefined;
    }

    getFkTemplateFields(string: `${string}.${string}`) {
        const [collection, field] = string.split('.') as [string, string];
        return this.getCollection(collection).template?.fields;
    }

    doArray(string: IDbFieldRules) {}

    doObject(string: `${IdDbPrimitive}.${IdDbPrimitive}`) {}

    testIs(what: 'array' | 'object' | 'fk' | 'primitive', fieldType: IDbFieldRules): any | undefined {
        let test;
        if (what === 'fk') test = fieldType.startsWith('fk-');
        if (what === 'array') test = fieldType.startsWith('array-of-');
        if (what === 'object') test = fieldType.startsWith('object-');
        if (what === 'primitive') test = !fieldType.startsWith('fk-') && !fieldType.startsWith('array-of-') && !fieldType.startsWith('object-');
        return test ? this.is(what, fieldType) : undefined;
    }

    is(what: 'array' | 'object' | 'fk' | 'primitive', fieldType: IDbFieldRules): Partial<IDbForge> {
        const forge = this.extract(what, fieldType);
        switch (what) {
            case 'array':
                return forge;
            case 'object':
                return forge;
            case 'fk':
                return forge;
            case 'primitive':
                return forge;
        }
    }

    // class for values IDbFieldValues
    presentation(collection: TplCollectionName, data: Record<string, any>) {
        let presentation = this.getTemplatePresentation(collection);
        let fields = presentation?.split(' ') ?? [];
        fields.map((field: string) => data[field]).join(' ');
        return fields.map((field: string) => data[field]).join(' ');
    }

    text(field: string, collection: TplCollectionName, data: Record<string, any>) {}
    input(field: string, collection: TplCollectionName, data: Record<string, any>) {}

    indexValue(collection: TplCollectionName, data: Record<string, any>) {
        let presentation = this.getIndexName(collection);
        return data[presentation];
    }

    extract(type: 'array' | 'object' | 'fk' | 'primitive', fieldRule: IDbFieldRules): Partial<IDbForge> {
        // fieldType
        function extractAfter(pattern: string, source: string) {
            // remove all between () on source
            const reg = source?.split('(')?.[0];

            return reg.split(pattern)[1] as IDbFieldRules;
        }

        function extractArgs(source: string): { piece: any; args: [TplProperties] | [keyof typeof TplProperties] } | undefined {
            const [piece, remaining] = source.split('(');
            if (!remaining) return;
            const [central] = remaining?.split(')');
            const args = central?.split(' ') as [TplProperties] | [keyof typeof TplProperties];
            return { piece, args };
        }

        let extractedArgs = extractArgs(fieldRule);
        let fieldType;
        let is = extractedArgs?.piece;
        let fieldArgs = extractedArgs?.args;
        switch (type) {
            case 'array':
                fieldType = extractAfter('array-of-', fieldRule);
                is = is ?? fieldType;
                break;
            case 'object':
                fieldType = extractAfter('object-', fieldRule);
                is = is ?? fieldType;
                break;
            case 'fk':
                fieldType = this.getFkFieldType(extractAfter('fk-', fieldRule));
                is = extractedArgs?.piece;
                console.log('extractAfter', extractAfter('fk-', fieldRule), { fieldType, fieldRule, fieldArgs, is });

                break;
            case 'primitive':
                fieldType = extractedArgs?.piece;
                is = is ?? fieldType;
                break;
        }

        return { fieldType, fieldRule, fieldArgs, is: type };
    }
}

export class iDBFieldValues {
    dbFields: IDbFields;
    collection: TplCollectionName;

    constructor(collection: TplCollectionName) {
        this.collection = collection;
        this.dbFields = new IDbFields();
    }

    // class for values IDbFieldValues
    presentation(data: Record<string, any>) {
        let presentation = this.dbFields.getTemplatePresentation(this.collection);
        let fields = presentation.split(' ');
        fields.map((field: string) => data[field]).join(' ');
        return fields.map((field: string) => data[field]).join(' ');
    }

    text(field: string, data: Record<string, any>) {
        let fields = this.dbFields.getTemplateFields(this.collection);
        let rules = this.dbFields.parseCollectionFieldName(this.collection, field);
        rules?.fieldArgs;
        let tpl = fields[field]; // IDbTypes
        switch (rules?.fieldType) {
            case 'number':
                return;
            case 'text-tiny':
                return data[field].substring(0, 10);
            case 'text-short':
                return data[field].substring(0, 20);
            case 'text-medium':
                return data[field].substring(0, 30);
            case 'text-long':
                return data[field].substring(0, 40);
            case 'text-giant':
                return data[field].substring(0, 50);
            default:
                return data[field];
        }
    }
    input(field: string, data: Record<string, any>) {}

    indexValue(data: Record<string, any>) {
        let presentation = this.dbFields.getIndexName(this.collection);
        return data[presentation];
    }
}
