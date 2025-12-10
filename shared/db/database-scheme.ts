import type { DatabaseSchema } from './schema-definition.js';

export const appSchema: DatabaseSchema = {
    users: {
        primaryKey: 'user_id',
        indexes: ['username'],
        template: { 
            presentation: 'username',
            card_lines: ['username', 'created_at']
        },
        fields: {
            user_id: { type: 'uuid', required: true },
            username: { type: 'string', required: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true }
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
            theme: { type: 'string', ui: { type: 'select', options: ['light', 'dark', 'system'] } },
            locale: { type: 'string', ui: { type: 'select', options: ['en', 'fr', 'es', 'de'] } },
            auto_play_audio: { type: 'boolean', ui: { type: 'toggle' } },
            server_url: { type: 'string', ui: { type: 'url' } },
            default_model: { type: 'string' },
            default_temperature: { type: 'number', ui: { type: 'slider', min: 0, max: 1, step: 0.1 } },
            updated_at: { type: 'timestamp', auto: true }
        }
    },
    companions: {
        primaryKey: 'companion_id',
        indexes: ['name'],
        template: { 
            presentation: 'name',
            card_lines: ['description', 'model', 'specialization']
        },
        fields: {
            companion_id: { type: 'uuid', required: true },
            name: { type: 'string', required: true },
            description: { type: 'string', ui: { type: 'textarea' } },
            system_prompt: { type: 'text-long', required: true, ui: { type: 'textarea', rows: 10 } },
            model: { type: 'string', required: true },
            voice_id: { type: 'string' },
            voice_tone: { type: 'string', enum: ['neutral', 'fast', 'slow', 'deep', 'high'] },
            mood: { type: 'string', enum: ['neutral', 'happy', 'sad', 'angry', 'sarcastic', 'professional', 'friendly'] },
            avatar: { type: 'string', ui: { type: 'image' } },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true },
            specialization: { type: 'string' },
            is_locked: { type: 'boolean' }
        }
    },
    user_companions: {
        primaryKey: 'companion_id',
        indexes: ['name', 'user_id'],
        template: { 
            presentation: 'name',
            card_lines: ['description', 'model', 'specialization']
        },
        fk: {
            user_id: { table: 'users', required: true },
            original_companion_id: { table: 'companions', required: false }
        },
        fields: {
            companion_id: { type: 'uuid', required: true },
            user_id: { type: 'uuid', required: true },
            original_companion_id: { type: 'uuid' },
            name: { type: 'string', required: true },
            description: { type: 'string', ui: { type: 'textarea' } },
            system_prompt: { type: 'text-long', required: true, ui: { type: 'textarea', rows: 10 } },
            model: { type: 'string', required: true },
            voice_id: { type: 'string' },
            voice_tone: { type: 'string', enum: ['neutral', 'fast', 'slow', 'deep', 'high'] },
            mood: { type: 'string', enum: ['neutral', 'happy', 'sad', 'angry', 'sarcastic', 'professional', 'friendly'] },
            avatar: { type: 'string', ui: { type: 'image' } },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true },
            specialization: { type: 'string' },
            is_locked: { type: 'boolean' }
        }
    },
    chats: {
        primaryKey: 'chat_id',
        indexes: ['user_id', 'companion_id', 'updated_at'],
        template: {
            presentation: 'title',
            card_lines: ['title', 'model', 'companion_id.name']
        },
        fk: {
            user_id: { table: 'users', required: true },
            companion_id: { table: 'companions', required: false }
        },
        fields: {
            chat_id: { type: 'uuid', required: true },
            user_id: { type: 'uuid', required: true },
            companion_id: { type: 'uuid' },
            title: { type: 'string', required: true },
            description: { type: 'string' },
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
        template: {
            presentation: 'content',
            card_lines: ['role', 'content', 'model']
        },
        fk: {
            chat_id: { table: 'chats', required: true }
        },
        fields: {
            message_id: { type: 'uuid', required: true },
            chat_id: { type: 'uuid', required: true },
            role: { type: 'string', required: true, enum: ['system', 'user', 'assistant', 'tool'] },
            content: { type: 'text-long', required: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true },
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
    },
    user_prompts: {
        primaryKey: 'prompt_id',
        indexes: ['is_active'],
        template: {
            presentation: 'content',
            card_lines: ['content', 'is_active']
        },
        fields: {
            prompt_id: { type: 'uuid', required: true },
            content: { type: 'text-long', required: true, ui: { type: 'textarea', rows: 3, label: 'Prompt / Phrase' } },
            is_active: { type: 'boolean', ui: { type: 'toggle', label: 'Active' }, default: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true }
        }
    },
    languages: {
        primaryKey: 'code',
        indexes: ['name'],
        template: {
            presentation: 'name',
            card_lines: ['name', 'flag']
        },
        fields: {
            code: { type: 'string', required: true }, // 'en', 'fr', etc.
            name: { type: 'string', required: true },
            flag: { type: 'string', required: true }, // Emoji or image path
            created_at: { type: 'timestamp', auto: true },
            updated_at: { type: 'timestamp', auto: true }
        }
    },
    tags: {
        primaryKey: 'tag_id',
        indexes: ['name'],
        template: {
            presentation: 'name',
            card_lines: ['name']
        },
        fields: {
            tag_id: { type: 'uuid', required: true },
            name: { type: 'string', required: true },
            created_at: { type: 'timestamp', required: true, auto: true },
            updated_at: { type: 'timestamp', auto: true }
        }
    }
};
