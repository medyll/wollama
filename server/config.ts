import path from 'path';

export const config = {
    server: {
        port: Number(process.env.PORT) || 3000,
        host: process.env.HOST || '0.0.0.0',
    },
    database: {
        // Directory where PouchDB stores data (LevelDB files)
        // Defaults to 'data' folder in the project root
        dir: process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.resolve(process.cwd(), 'db_data')
    },
    pouchdb: {
        // Configuration for express-pouchdb
        inMemoryConfig: true,
        mode: 'minimumForPouchDB' as const, // 'full' | 'minimumForPouchDB' | 'custom'
        // Path for logs if we wanted to enable file logging (optional)
        logPath: path.resolve(process.cwd(), 'logs')
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    ollama: {
        host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
    }
};
