import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSearchAgent } from './web-search.agent.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
    mockFetch.mockReset();
});

describe('WebSearchAgent', () => {
    it('returns results for a valid query', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                Heading: 'Svelte',
                AbstractText: 'Svelte is a front-end framework.',
                AbstractURL: 'https://svelte.dev',
                RelatedTopics: [
                    { FirstURL: 'https://svelte.dev/docs', Text: 'Svelte Docs - Official documentation' }
                ]
            })
        });

        const result = await WebSearchAgent.run({ query: 'Svelte 5 runes' });
        expect(result.error).toBeUndefined();
        expect(result.results.length).toBeGreaterThanOrEqual(1);
        expect(result.results[0].url).toBe('https://svelte.dev');
        expect(result.query).toBe('Svelte 5 runes');
    });

    it('returns error for empty query', async () => {
        const result = await WebSearchAgent.run({ query: '' });
        expect(result.error).toBeTruthy();
        expect(result.results).toHaveLength(0);
    });

    it('returns error for whitespace-only query', async () => {
        const result = await WebSearchAgent.run({ query: '   ' });
        expect(result.error).toBeTruthy();
        expect(result.results).toHaveLength(0);
    });

    it('returns error on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('network timeout'));
        const result = await WebSearchAgent.run({ query: 'test' });
        expect(result.error).toBe('network timeout');
        expect(result.results).toHaveLength(0);
    });

    it('returns error when API returns non-200', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
        const result = await WebSearchAgent.run({ query: 'test' });
        expect(result.error).toContain('503');
        expect(result.results).toHaveLength(0);
    });

    it('returns error when no results found', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ AbstractText: '', AbstractURL: '', Heading: '', RelatedTopics: [] })
        });
        const result = await WebSearchAgent.run({ query: 'xyzzy404notfound' });
        expect(result.error).toBeTruthy();
        expect(result.results).toHaveLength(0);
    });
});
