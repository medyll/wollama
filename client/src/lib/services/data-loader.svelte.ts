import { getDatabase } from '$lib/db';
import { appSchema } from '../../../../shared/db/database-scheme';

export class DataService {
    private tableName: string;
    private tableDef: any;
    private cardLines: string[];

    constructor(tableName: string) {
        this.tableName = tableName;
        this.tableDef = appSchema[tableName];
        this.cardLines = this.tableDef?.template?.card_lines || [];
    }

    async resolveRelations(data: any, db: any) {
        const resolvedLines: Record<string, any> = {};
        
        for (const line of this.cardLines) {
            if (line.includes('.')) {
                const [foreignKey, field] = line.split('.');
                // Check if it's a relation
                if (this.tableDef.fk && this.tableDef.fk[foreignKey]) {
                    const relatedTable = this.tableDef.fk[foreignKey].table;
                    const relatedId = data[foreignKey];
                    if (relatedId) {
                        try {
                            const relatedDoc = await db[relatedTable].findOne(relatedId).exec();
                            if (relatedDoc) {
                                resolvedLines[line] = relatedDoc[field];
                            }
                        } catch (e) {
                            console.warn(`Failed to resolve relation ${line}`, e);
                        }
                    }
                }
            } else {
                resolvedLines[line] = data[line];
            }
        }
        return resolvedLines;
    }

    async loadById(id: string) {
        try {
            const db = await getDatabase();
            const doc = await db[this.tableName].findOne(id).exec();
            
            if (doc) {
                const docData = doc.toJSON();
                const resolvedLines = await this.resolveRelations(docData, db);
                
                return {
                    ...docData,
                    _resolved: resolvedLines
                };
            }
            return null;
        } catch (e) {
            console.error('Error loading data by ID:', e);
            throw e;
        }
    }

    async loadList(orderBy: string, orderDirection: 'asc' | 'desc') {
        try {
            const db = await getDatabase();
            if (!db[this.tableName]) {
                throw new Error(`Table ${this.tableName} not found`);
            }

            let query = db[this.tableName].find();
            
            if (orderBy && this.tableDef.fields[orderBy]) {
                query = query.sort({ [orderBy]: orderDirection });
            }

            return query;
        } catch (e) {
            console.error('Error preparing list query:', e);
            throw e;
        }
    }

    async processDocs(docs: any[]) {
        const db = await getDatabase();
        return Promise.all(docs.map(async (doc) => {
            const data = doc.toJSON();
            const resolvedLines = await this.resolveRelations(data, db);
            return {
                ...data,
                _resolved: resolvedLines
            };
        }));
    }
}