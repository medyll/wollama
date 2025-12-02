declare module 'express-pouchdb' {
    import { Router } from 'express';
    import PouchDB from 'pouchdb';

    interface ExpressPouchDBOptions {
        configPath?: string;
        logPath?: string;
        inMemoryConfig?: boolean;
        mode?: 'fullCouchDB' | 'minimumForPouchDB' | 'custom';
        overrideMode?: {
            include?: string[];
            exclude?: string[];
        };
    }

    function expressPouchDB(pouchDB: any, options?: ExpressPouchDBOptions): Router;
    export = expressPouchDB;
}
