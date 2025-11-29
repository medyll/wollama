import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import path from 'path';
import fs from 'fs';
import { User, Companion, Chat, Message } from '../types/data.js';

// Register the find plugin for MongoDB-style queries
PouchDB.plugin(PouchFind);

// Ensure data directory exists
const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Define database instances with types
// PouchDB automatically uses LevelDB in Node.js environment
export const usersDb = new PouchDB<User>(path.join(DATA_DIR, 'users'));
export const companionsDb = new PouchDB<Companion>(path.join(DATA_DIR, 'companions'));
export const chatsDb = new PouchDB<Chat>(path.join(DATA_DIR, 'chats'));
export const messagesDb = new PouchDB<Message>(path.join(DATA_DIR, 'messages'));

// Initialize indexes
const initIndexes = async () => {
    try {
        await usersDb.createIndex({
            index: { fields: ['username'] }
        });
        
        await companionsDb.createIndex({
            index: { fields: ['name'] }
        });

        await chatsDb.createIndex({
            index: { fields: ['user_id', 'companion_id', 'updated_at'] }
        });

        await messagesDb.createIndex({
            index: { fields: ['chat_id', 'created_at'] }
        });
        
        console.log('Database indexes initialized');
    } catch (err) {
        console.error('Failed to create indexes:', err);
    }
};

initIndexes();
