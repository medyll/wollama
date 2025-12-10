import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetadataService } from './metadata.service';

// Mock userState
vi.mock('$lib/state/user.svelte', () => ({
    userState: {
        preferences: {
            serverUrl: 'http://localhost:3000',
            defaultModel: 'mistral'
        }
    }
}));

// Mock getDatabase
vi.mock('$lib/db', () => ({
    getDatabase: vi.fn()
}));

describe('MetadataService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    it('should generate metadata correctly', async () => {
        const mockResponse = {
            message: {
                content: JSON.stringify({
                    title: 'Test Title',
                    description: 'Test Description',
                    category: 'Coding',
                    tags: ['test', 'code']
                })
            }
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await MetadataService.generateChatMetadata('some chat content');

        expect(result).toEqual({
            title: 'Test Title',
            description: 'Test Description',
            category: 'Coding',
            tags: ['test', 'code']
        });

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3000/api/chat/generate',
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('some chat content')
            })
        );
    });

    it('should handle invalid JSON response', async () => {
        const mockResponse = {
            message: {
                content: 'Invalid JSON'
            }
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await MetadataService.generateChatMetadata('content');
        expect(result).toBeNull();
    });

    it('should handle fetch error', async () => {
        (global.fetch as any).mockRejectedValue(new Error('Network error'));

        const result = await MetadataService.generateChatMetadata('content');
        expect(result).toBeNull();
    });
});
