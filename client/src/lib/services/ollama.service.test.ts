import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testOllamaConnection, normalizeServerUrl } from '$lib/services/ollama.service';

describe('Ollama Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('testOllamaConnection', () => {
		it('should return success for valid Ollama server', async () => {
			// Mock successful fetch response
			global.fetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: async () => ({ models: [] })
			});

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
			expect(result.errorType).toBeUndefined();
			expect(result.suggestion).toBeUndefined();
		});

		it('should return invalid-url error for malformed URL', async () => {
			const result = await testOllamaConnection('not a url');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('invalid-url');
			expect(result.error).toBe('Invalid URL format');
			expect(result.suggestion).toContain('http://localhost:11434');
		});

		it('should return connection-refused error for failed fetch', async () => {
			global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('connection-refused');
			expect(result.error).toBe('Connection refused');
			expect(result.suggestion).toContain('running');
		});

		it('should return timeout error for AbortError', async () => {
			const abortError = new Error('AbortError');
			abortError.name = 'AbortError';
			global.fetch = vi.fn().mockRejectedValueOnce(abortError);

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('timeout');
			expect(result.error).toBe('Connection timeout');
			expect(result.suggestion).toContain('running');
		});

		it('should return dns-failure error for ENOTFOUND', async () => {
			const dnsError = new Error('getaddrinfo ENOTFOUND example.com');
			global.fetch = vi.fn().mockRejectedValueOnce(dnsError);

			const result = await testOllamaConnection('http://example.com:11434');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('dns-failure');
			expect(result.error).toBe('DNS lookup failed');
			expect(result.suggestion).toContain('URL');
		});

		it('should return connection-refused error for ECONNREFUSED', async () => {
			const connError = new Error('ECONNREFUSED');
			global.fetch = vi.fn().mockRejectedValueOnce(connError);

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('connection-refused');
			expect(result.error).toBe('Connection refused');
		});

		it('should return server-error for 500+ response', async () => {
			global.fetch = vi.fn().mockResolvedValueOnce({
				ok: false,
				status: 500
			});

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('server-error');
			expect(result.error).toBe('Server error');
			expect(result.suggestion).toContain('restarting');
		});

		it('should handle empty server URL', async () => {
			const result = await testOllamaConnection('');

			expect(result.success).toBe(false);
			expect(result.errorType).toBe('invalid-url');
		});

		it('should normalize URL with trailing slash', async () => {
			global.fetch = vi.fn().mockResolvedValueOnce({
				ok: true,
				json: async () => ({ models: [] })
			});

			await testOllamaConnection('http://localhost:11434/');

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('http://localhost:11434/api/tags'),
				expect.any(Object)
			);
		});

		it('should include suggestion text with error', async () => {
			const connError = new Error('Connection failed');
			global.fetch = vi.fn().mockRejectedValueOnce(connError);

			const result = await testOllamaConnection('http://localhost:11434');

			expect(result.suggestion).toBeDefined();
			expect(typeof result.suggestion).toBe('string');
			expect(result.suggestion?.length).toBeGreaterThan(0);
		});
	});

	describe('normalizeServerUrl', () => {
		it('should return normalized URL for valid input', () => {
			const result = normalizeServerUrl('localhost:11434');
			expect(result).toBe('http://localhost:11434');
		});

		it('should preserve http protocol', () => {
			const result = normalizeServerUrl('http://localhost:11434');
			expect(result).toBe('http://localhost:11434');
		});

		it('should preserve https protocol', () => {
			const result = normalizeServerUrl('https://example.com:11434');
			expect(result).toBe('https://example.com:11434');
		});

		it('should trim whitespace', () => {
			const result = normalizeServerUrl('  localhost:11434  ');
			expect(result).toBe('http://localhost:11434');
		});

		it('should return null for invalid URL', () => {
			const result = normalizeServerUrl('not a url');
			expect(result).toBeNull();
		});

		it('should return null for empty string', () => {
			const result = normalizeServerUrl('');
			expect(result).toBeNull();
		});
	});
});
