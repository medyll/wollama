import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';

// Mock dependencies
vi.mock('$lib/db', () => ({
    getDatabase: vi.fn()
}));

vi.mock('$lib/state/user.svelte', () => ({
    userState: {
        uid: 'test-user',
        preferences: {
            serverUrl: 'http://localhost:3000',
            defaultModel: 'mistral'
        }
    }
}));

vi.mock('$lib/state/context.svelte', () => ({
    contextState: {
        getPayload: vi.fn().mockReturnValue([])
    }
}));

vi.mock('$lib/state/notifications.svelte', () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
        isFocused: false
    }
}));

vi.mock('$lib/state/i18n.svelte', () => ({
    t: (key: string) => key
}));

vi.mock('./metadata.service', () => ({
    MetadataService: {
        updateChatMetadata: vi.fn().mockResolvedValue(undefined)
    }
}));

import { getDatabase } from '$lib/db';

describe('ChatService', () => {
    let chatService: ChatService;
    let mockDb: any;

    beforeEach(() => {
        vi.clearAllMocks();
        chatService = new ChatService();

        // Setup mock DB
        mockDb = {
            chats: {
                insert: vi.fn().mockResolvedValue({}),
                find: vi.fn().mockReturnValue({
                    $: { subscribe: vi.fn() },
                    exec: vi.fn().mockResolvedValue([])
                }),
                findOne: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue({
                        system_prompt: 'System Prompt',
                        patch: vi.fn().mockResolvedValue({})
                    })
                })
            },
            messages: {
                insert: vi.fn().mockResolvedValue({}),
                find: vi.fn().mockReturnValue({
                    $: { subscribe: vi.fn() },
                    exec: vi.fn().mockResolvedValue([])
                }),
                findOne: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue({
                        patch: vi.fn().mockResolvedValue({})
                    })
                })
            },
            companions: {
                findOne: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue({
                        system_prompt: 'Companion Prompt',
                        mood: 'neutral'
                    })
                })
            }
        };

        (getDatabase as any).mockResolvedValue(mockDb);
        global.fetch = vi.fn();
    });

    it('should create a chat', async () => {
        const chatId = await chatService.createChat('Test Chat');
        expect(mockDb.chats.insert).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Test Chat',
            user_id: 'test-user'
        }));
        expect(chatId).toBeDefined();
    });

    it('should add a message', async () => {
        const chatId = 'chat-123';
        const messageId = await chatService.addMessage(chatId, 'user', 'Hello');
        
        expect(mockDb.messages.insert).toHaveBeenCalledWith(expect.objectContaining({
            chat_id: chatId,
            role: 'user',
            content: 'Hello'
        }));
        
        // Should update chat timestamp
        expect(mockDb.chats.findOne).toHaveBeenCalledWith(chatId);
    });

    it('should generate response', async () => {
        const chatId = 'chat-123';
        const history = [{ role: 'user', content: 'Hello' }];
        
        // Mock fetch stream response
        const mockStream = new ReadableStream({
            start(controller) {
                const data = JSON.stringify({ 
                    message: { content: 'World' }, 
                    done: true 
                });
                controller.enqueue(new TextEncoder().encode(data + '\n'));
                controller.close();
            }
        });

        (global.fetch as any).mockResolvedValue({
            ok: true,
            body: mockStream
        });

        const response = await chatService.generateResponse(chatId, history);
        
        expect(response).toBe('World');
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/chat/generate'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('Hello')
            })
        );
    });
});
