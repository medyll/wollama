import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process before imports
vi.mock('child_process', () => ({
	spawn: vi.fn()
}));

// Import service and dependencies
import { TtsService } from './tts.service.js';
import { spawn } from 'child_process';

describe('TtsService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default spawn mock for successful operations
		vi.mocked(spawn).mockReturnValue({
			stdin: { write: vi.fn(), end: vi.fn() },
			stderr: { on: vi.fn() },
			on: vi.fn().mockImplementation((event: string, cb: any) => {
				if (event === 'close') cb(0);
			})
		} as any);
	});

	describe('speak', () => {
		const testText = 'Hello world';

		it('should return null when TTS is disabled', async () => {
			const { config } = await import('../config.js');
			const originalEnabled = config.tts.enabled;
			(config.tts as any).enabled = false;

			try {
				const result = await TtsService.speak(testText);
				expect(result).toBeNull();
			} finally {
				(config.tts as any).enabled = originalEnabled;
			}
		});

		it('should call speakLocal when provider is local', async () => {
			const speakLocalSpy = vi.spyOn(TtsService as any, 'speakLocal').mockResolvedValue(new ArrayBuffer(0));

			await TtsService.speak(testText, 'alloy', 'neutral');

			expect(speakLocalSpy).toHaveBeenCalledWith(testText, 'alloy', 'neutral');
			speakLocalSpy.mockRestore();
		});

		it('should call remote TTS API when provider is not local', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.tts.provider;
			(config.tts as any).provider = 'openai';

			try {
				const mockArrayBuffer = new ArrayBuffer(1024);
				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					arrayBuffer: async () => mockArrayBuffer
				});
				global.fetch = mockFetch;

				const result = await TtsService.speak(testText, 'alloy', 'neutral');

				expect(result).toEqual(mockArrayBuffer);
				expect(mockFetch).toHaveBeenCalled();
			} finally {
				(config.tts as any).provider = originalProvider;
			}
		});

		it('should return null when remote API fails', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.tts.provider;
			(config.tts as any).provider = 'openai';

			try {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: false,
					statusText: 'Bad Request'
				});
				global.fetch = mockFetch;

				const result = await TtsService.speak(testText);

				expect(result).toBeNull();
			} finally {
				(config.tts as any).provider = originalProvider;
			}
		});
	});

	describe('checkHealth', () => {
		it('should return false when TTS is disabled', async () => {
			const { config } = await import('../config.js');
			const originalEnabled = config.tts.enabled;
			(config.tts as any).enabled = false;

			try {
				const result = await TtsService.checkHealth();
				expect(result).toBe(false);
			} finally {
				(config.tts as any).enabled = originalEnabled;
			}
		});

		it('should return true when remote API is reachable', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.tts.provider;
			(config.tts as any).provider = 'openai';

			try {
				const mockFetch = vi.fn().mockResolvedValue({ ok: true });
				global.fetch = mockFetch;

				const result = await TtsService.checkHealth();

				expect(result).toBe(true);
			} finally {
				(config.tts as any).provider = originalProvider;
			}
		});

		it('should return false when remote API connection refused', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.tts.provider;
			(config.tts as any).provider = 'openai';

			try {
				// Create a TypeError with cause to simulate connection refused
				const error = new TypeError('fetch failed');
				(error as any).cause = { code: 'ECONNREFUSED' };
				const mockFetch = vi.fn().mockRejectedValue(error);
				global.fetch = mockFetch;

				const result = await TtsService.checkHealth();

				expect(result).toBe(false);
			} finally {
				(config.tts as any).provider = originalProvider;
			}
		});
	});
});
