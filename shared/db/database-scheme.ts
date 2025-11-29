import type { DatabaseSchema } from './schema-definition.js';

export const appSchema: DatabaseSchema = {
    users: {
        primaryKey: 'user_id',
        indexes: ['username'],
        fields: {
            user_id: { type: 'uuid', required: true },
            username: { type: 'string', required: true },
            created_at: { type: 'timestamp', required: true, auto: true }
        }
    },
    user_preferences: {
        primaryKey: 'user_preferences_id',
        fk: {
            user_id: { table: 'users', required: true }
        },
        fields: {
            user_preferences_id: { type: 'uuid', required: true },
            user_id: { type: 'uuid', required: true },
            theme: { type: 'string' },
            locale: { type: 'string' },
            auto_play_audio: { type: 'boolean' },
            server_url: { type: 'string' },
            default_model: { type: 'string' },
            default_temperature: { type: 'number' }
        }
    },
    companions: {
        primaryKey: 'companion_id',
        indexes: ['name'],
        fields: {
            companion_id: { type: 'uuid', required: true },
            name: { type: 'string', required: true },
            description: { type: 'string' },
            system_prompt: { type: 'text-long', required: true },
            model: { type: 'string', required: true },
            voice_id: { type: 'string' },
            avatar: { type: 'string' },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true },
            specialization: { type: 'string' },
            is_locked: { type: 'boolean' }
        }
    },
    chats: {
        primaryKey: 'chat_id',
        indexes: ['user_id', 'companion_id', 'updated_at'],
        fk: {
            user_id: { table: 'users', required: true },
            companion_id: { table: 'companions', required: false }
        },
        fields: {
            chat_id: { type: 'uuid', required: true },
            user_id: { type: 'uuid', required: true },
            companion_id: { type: 'uuid' },
            title: { type: 'string', required: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', required: true, auto: true },
            tags: { type: 'array', items: { type: 'string' } },
            category: { type: 'string' },
            system_prompt: { type: 'text-long' },
            context: { type: 'array', items: { type: 'number' } },
            model: { type: 'string' }
        }
    },
    messages: {
        primaryKey: 'message_id',
        indexes: ['chat_id', 'created_at'],
        fk: {
            chat_id: { table: 'chats', required: true }
        },
        fields: {
            message_id: { type: 'uuid', required: true },
            chat_id: { type: 'uuid', required: true },
            role: { type: 'string', required: true, enum: ['system', 'user', 'assistant', 'tool'] },
            content: { type: 'text-long', required: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            status: { type: 'string', enum: ['idle', 'done', 'sent', 'streaming', 'error'] },
            context: { type: 'array', items: { type: 'number' } },
            model: { type: 'string' },
            audio_file_path: { type: 'string' },
            images: { 
                type: 'array', 
                items: { 
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        type: { type: 'string' },
                        dataUri: { type: 'string' },
                        base64: { type: 'string' }
                    }
                } 
            },
            urls: { 
                type: 'array', 
                items: { 
                    type: 'object',
                    properties: {
                        url: { type: 'string' },
                        image: { type: 'string' },
                        order: { type: 'number' },
                        title: { type: 'string' }
                    }
                } 
            }
        }
    }
};
