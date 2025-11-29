import fs from 'fs/promises';
import path from 'path';

// Simple JSON file storage for MVP
const DB_PATH = path.resolve('data.json');

export const StorageService = {
    async init() {
        try {
            await fs.access(DB_PATH);
        } catch {
            await fs.writeFile(DB_PATH, JSON.stringify({ users: [], chats: [], messages: [] }));
        }
    },

    async read() {
        const data = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(data);
    },

    async write(data) {
        await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }
};
