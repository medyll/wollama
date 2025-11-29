import { usersDb, companionsDb, chatsDb, messagesDb } from '../db/database.js';
import { User, Companion, Chat, Message } from '../types/data.js';

// Helper to strip PouchDB internal fields if needed, or just return as is.
// PouchDB returns documents with _id and _rev.
// Our interfaces expect user_id, etc.
// We will ensure _id matches the entity ID.

export const StorageService = {
    users: {
        async getAll(): Promise<User[]> {
            const result = await usersDb.allDocs({ include_docs: true });
            return result.rows.map(row => row.doc as unknown as User);
        },
        async get(id: string): Promise<User | null> {
            try {
                return await usersDb.get(id) as unknown as User;
            } catch {
                return null;
            }
        },
        async create(user: User): Promise<User> {
            const doc = { ...user, _id: user.user_id };
            await usersDb.put(doc);
            return user;
        },
        async update(user: User): Promise<User> {
            const existing = await usersDb.get(user.user_id);
            const doc = { ...user, _id: user.user_id, _rev: existing._rev };
            await usersDb.put(doc);
            return user;
        }
    },

    companions: {
        async getAll(): Promise<Companion[]> {
            const result = await companionsDb.allDocs({ include_docs: true });
            return result.rows.map(row => row.doc as unknown as Companion);
        },
        async create(companion: Companion): Promise<Companion> {
            const doc = { ...companion, _id: companion.companion_id };
            await companionsDb.put(doc);
            return companion;
        },
        async update(companion: Companion): Promise<Companion> {
            try {
                const existing = await companionsDb.get(companion.companion_id);
                const doc = { ...companion, _id: companion.companion_id, _rev: existing._rev };
                await companionsDb.put(doc);
                return companion;
            } catch (err) {
                const error = err as { status?: number };
                if (error.status === 404) {
                    return this.create(companion);
                }
                throw err;
            }
        }
    },

    chats: {
        async getAll(): Promise<Chat[]> {
            const result = await chatsDb.allDocs({ include_docs: true });
            return result.rows.map(row => row.doc as unknown as Chat);
        },
        async getByUser(userId: string): Promise<Chat[]> {
            // Note: Requires index on user_id
            const result = await chatsDb.find({
                selector: { user_id: userId },
                sort: [{ updated_at: 'desc' }]
            });
            return result.docs as unknown as Chat[];
        },
        async get(chatId: string): Promise<Chat | null> {
            try {
                return await chatsDb.get(chatId) as unknown as Chat;
            } catch {
                return null;
            }
        },
        async create(chat: Chat): Promise<Chat> {
            const doc = { ...chat, _id: chat.chat_id };
            await chatsDb.put(doc);
            return chat;
        },
        async update(chat: Chat): Promise<Chat> {
            const existing = await chatsDb.get(chat.chat_id);
            const doc = { ...chat, _id: chat.chat_id, _rev: existing._rev };
            await chatsDb.put(doc);
            return chat;
        },
        async delete(chatId: string): Promise<void> {
            const doc = await chatsDb.get(chatId);
            await chatsDb.remove(doc);
        }
    },

    messages: {
        async getByChat(chatId: string): Promise<Message[]> {
            // Note: Requires index on chat_id
            const result = await messagesDb.find({
                selector: { chat_id: chatId },
                sort: [{ created_at: 'asc' }]
            });
            return result.docs as unknown as Message[];
        },
        async add(message: Message): Promise<Message> {
            const doc = { ...message, _id: message.message_id };
            await messagesDb.put(doc);
            return message;
        },
        async update(message: Message): Promise<Message> {
            const existing = await messagesDb.get(message.message_id);
            const doc = { ...message, _id: message.message_id, _rev: existing._rev };
            await messagesDb.put(doc);
            return message;
        }
    }
};
