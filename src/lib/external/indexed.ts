export class IndexedDBWrapper<T = any> {
	private dbConnection?: IDBOpenDBRequest;
	private databaseName: string;
	private dbVersion!: number;
	private idbDatabase?: IDBDatabase;
	private schema: Record<string, any> = {};

	constructor(databaseName: string, asyncMode = true) {
		this.databaseName = databaseName;
		this.idbDatabase = undefined;

		//this.constructor.prototype.toArray = '';
		var prototype = Object.getPrototypeOf(this);

		prototype.foo = 100;
		console.log(prototype);
	}

	version(version: number) {
		this.dbVersion = version;
		return {
			stores: async (args: any) => {
				if (typeof window !== 'undefined') {
					// store the schema
					this.schema = args;
					// open the database
					this.openDatabase(version);
					this.createTable(args);

					if (this.dbConnection)
						this.dbConnection.onupgradeneeded = (event: Event) => {
							const m = new StoreManager();
							m.doSchema(this.dbConnection.result, args);
							console.log(this);
						};
				}
			}
		};
	}

	createTable(args: any) {
		Object.keys(this.schema).map(async (storeName) => {
			console.log(storeName);
			this[storeName] = new Table2();
		});
	}

	private openDatabase(version: number) {
		// open the database
		this.dbConnection = window.indexedDB.open(this.databaseName, version ?? this.dbVersion);

		this.dbConnection.onerror = (event) => {};

		this.dbConnection.onsuccess = (event: Event) => {
			console.log('onsuccess', this.databaseName, this.dbVersion);
			this.idbDatabase = this.dbConnection?.result;
		};
	}

	private closeDatabase(): void {
		if (this.idbDatabase) {
			this.idbDatabase.close();
			this.idbDatabase = undefined;
		}
	}
}

export class Table2<T> {
    private store: IDBObjectStore;

	constructor(store: IDBObjectStore) {
        this.store = store;
    }

	async set(value: T): Promise<T> {}

	async add(value: T): Promise<T> {}
	async put(value: T): Promise<T> {}
	async update(key: string, value: T): Promise<T> {}

	async get(value: T): Promise<T> {}
    // mongodb operators
	async where({key,value}: Record<string, keyof T>)  {
        Object.keys(key).map((k) => {
            console.log(k);
            switch (k) {
                case '$eq':
                    // equals
                    
                    break;
                case 'gt':
                    break;
                case 'gte':
                    break;
                case 'in':
                    break;
                case 'lt':
                    break;
                case 'lte':
                    break;
                case 'ne':
                    break;
                case 'nin':

                    break;
                default:
                    break;
            }
        })
    }

	async delete(key: string): Promise<T> {}
}

class StoreManager {
	storeListFields = {
		chat: '&chatId, dateCreation, dateLastMessage',
		messages: '&messageId, chatId, dateCreation',
		messageStats: '&messageId, create_at'
	};

	createStore(
		db: IDBDatabase | null,
		storeName: string,
		keyPath: string,
		autoIncrement: boolean = false
	) {
		const objectStore = db?.createObjectStore(storeName, { keyPath, autoIncrement });
		return objectStore;
	}

	async doSchema(db: IDBDatabase, storeListFields: any) {
		Object.keys(storeListFields).map(async (storeName) => {
			console.log(storeName);
			const storeConfig = storeListFields[storeName];
			const fields = storeConfig.split(',').map((field: string) => {
				return field.trim();
			});
			// the field starting with ++ is the keyPath
			const incrementField = fields
				.find((field: string) => field.startsWith('++'))
				?.replace('++', '');
			const declaredIndex = fields.find((field: string) => field.startsWith('&'))?.replace('&', '');
			// set default path
			const keyPath = incrementField || declaredIndex || fields[0];
			console.log('---------', incrementField, declaredIndex, fields[0]);
			// set autoIncrement
			const increment = Boolean(incrementField);
			// create the store
			const store = this.createStore(db, storeName, keyPath, increment);

			// create the indexes
			for (const field of fields) {
				await this.createIndexes(store, field, field);
			}
			//await this.createIndexes(store)
			return { storeName, keyPath };
		});
	}
	cleanIndexes(index: string) {
		return index.replace('&', '').replace('++', '').trim();
	}
	async createIndexes(store: IDBObjectStore, indexName: string, keyPath: string) {
		// create the index
		console.log(indexName, keyPath);
		store.createIndex(this.cleanIndexes(indexName), this.cleanIndexes(keyPath));
		this[keyPath] = 100;
	}
}
