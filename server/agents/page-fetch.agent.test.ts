import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PageFetchAgent } from './page-fetch.agent.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
    mockFetch.mockReset();
});

function makeFetchResponse(body: string, status = 200, contentType = 'text/html') {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (k: string) => k === 'content-type' ? contentType : null },
        text: async () => body
    };
}

describe('PageFetchAgent', () => {
    it('returns readable text for a valid HTML page', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse('<html><body><p>Hello World</p></body></html>'));
        const result = await PageFetchAgent.run({ url: 'https://example.com' });
        expect(result.error).toBeUndefined();
        expect(result.content).toContain('Hello World');
        expect(result.truncated).toBe(false);
        expect(result.url).toBe('https://example.com');
    });

    it('truncates content over 4000 chars', async () => {
        const longText = 'A'.repeat(5000);
        mockFetch.mockResolvedValueOnce(makeFetchResponse(`<p>${longText}</p>`));
        const result = await PageFetchAgent.run({ url: 'https://example.com' });
        expect(result.truncated).toBe(true);
        expect(result.content).toContain('[Content truncated');
        expect(result.content.length).toBeLessThan(5000);
    });

    it('returns error for empty URL', async () => {
        const result = await PageFetchAgent.run({ url: '' });
        expect(result.error).toBeTruthy();
        expect(result.content).toBe('');
    });

    it('returns error for invalid URL', async () => {
        const result = await PageFetchAgent.run({ url: 'not-a-url' });
        expect(result.error).toBe('Invalid URL');
        expect(result.content).toBe('');
    });

    it('returns error on network failure', async () => {
        mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
        const result = await PageFetchAgent.run({ url: 'https://example.com' });
        expect(result.error).toBe('ECONNREFUSED');
        expect(result.content).toBe('');
    });

    it('returns error for non-200 HTTP status', async () => {
        mockFetch.mockResolvedValueOnce(makeFetchResponse('', 404));
        const result = await PageFetchAgent.run({ url: 'https://example.com/missing' });
        expect(result.error).toContain('404');
        expect(result.content).toBe('');
    });

    it('strips script and style tags from HTML', async () => {
        const html = '<html><head><style>body{color:red}</style></head><body><script>alert(1)</script><p>Clean content</p></body></html>';
        mockFetch.mockResolvedValueOnce(makeFetchResponse(html));
        const result = await PageFetchAgent.run({ url: 'https://example.com' });
        expect(result.content).not.toContain('<script>');
        expect(result.content).not.toContain('alert(1)');
        expect(result.content).toContain('Clean content');
    });
});
