import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testOllamaConnection } from '$lib/services/ollama.service';

describe('Onboarding Error Handling (Story 1.3)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should return specific error message for connection refused', async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

		const result = await testOllamaConnection('http://localhost:11434');

		expect(result.success).toBe(false);
		expect(result.errorType).toBe('connection-refused');
		expect(result.error).toBe('Connection refused');
	});

	it('should include suggestion text with error', async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

		const result = await testOllamaConnection('http://localhost:11434');

		expect(result.suggestion).toBeDefined();
		expect(result.suggestion).toContain('running');
	});

	it('should distinguish DNS failure from connection refused', async () => {
		const dnsError = new Error('getaddrinfo ENOTFOUND example.com');
		global.fetch = vi.fn().mockRejectedValueOnce(dnsError);

		const result = await testOllamaConnection('http://invalidhost:11434');

		expect(result.errorType).toBe('dns-failure');
		expect(result.error).toBe('DNS lookup failed');
	});

	it('should distinguish timeout error from connection refused', async () => {
		const abortError = new Error('AbortError');
		abortError.name = 'AbortError';
		global.fetch = vi.fn().mockRejectedValueOnce(abortError);

		const result = await testOllamaConnection('http://localhost:11434');

		expect(result.errorType).toBe('timeout');
		expect(result.error).toBe('Connection timeout');
	});

	it('should handle retry with different outcomes', async () => {
		global.fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('Failed to fetch')) // First attempt fails
			.mockResolvedValueOnce({
				// Second attempt succeeds
				ok: true,
				json: async () => ({ models: [] })
			});

		let result = await testOllamaConnection('http://localhost:11434');
		expect(result.success).toBe(false);

		// Second attempt with fresh fetch mock
		result = await testOllamaConnection('http://localhost:11434');
		expect(result.success).toBe(true);
	});

	it('should provide contextual suggestions for connection errors', async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

		const result = await testOllamaConnection('http://localhost:11434');

		expect(result.error).toBe('Connection refused');
		expect(result.suggestion).toContain('running');
		expect(result.suggestion).toContain('reachable');
	});

	it('should provide timeout suggestion when server is slow', async () => {
		global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

		const abortError = new Error('AbortError');
		abortError.name = 'AbortError';
		global.fetch = vi.fn().mockRejectedValueOnce(abortError);

		const result = await testOllamaConnection('http://localhost:11434');

		expect(result.errorType).toBe('timeout');
		expect(result.suggestion).toContain('running');
	});

	it('should provide invalid URL suggestion', async () => {
		const result = await testOllamaConnection('not a url');

		expect(result.errorType).toBe('invalid-url');
		expect(result.suggestion).toContain('localhost:11434');
	});
});
