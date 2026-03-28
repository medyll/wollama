import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock child_process and ffmpeg before imports
vi.mock('child_process', () => ({
	spawn: vi.fn()
}));

vi.mock('fluent-ffmpeg', () => {
	const fn = vi.fn();
	fn.setFfmpegPath = vi.fn();
	fn.default = fn;
	return { default: fn };
});

// Import service and dependencies
import { SttService } from './stt.service.js';
import { spawn } from 'child_process';

describe('SttService', () => {
	const mockAudioBuffer = Buffer.from('mock-audio-data');

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('transcribe', () => {
		it('should return mock transcription when STT is disabled', async () => {
			const { config } = await import('../config.js');
			const originalEnabled = config.stt.enabled;
			(config.stt as any).enabled = false;

			try {
				const result = await SttService.transcribe(mockAudioBuffer);
				expect(result).toBe('Transcription simulée (STT désactivé)');
			} finally {
				(config.stt as any).enabled = originalEnabled;
			}
		});

		it('should call transcribeLocal when provider is local', async () => {
			const transcribeLocalSpy = vi
				.spyOn(SttService as any, 'transcribeLocal')
				.mockResolvedValue('mocked text');

			await SttService.transcribe(mockAudioBuffer, 'test.wav', 'fr');

			expect(transcribeLocalSpy).toHaveBeenCalledWith(mockAudioBuffer, 'fr');
			transcribeLocalSpy.mockRestore();
		});

		it('should call remote STT API when provider is not local', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.stt.provider;
			(config.stt as any).provider = 'openai';

			try {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: true,
					json: async () => ({ text: 'remote transcription' })
				});
				global.fetch = mockFetch;

				const result = await SttService.transcribe(mockAudioBuffer, 'test.wav', 'en');

				expect(result).toBe('remote transcription');
				expect(mockFetch).toHaveBeenCalled();
			} finally {
				(config.stt as any).provider = originalProvider;
			}
		});

		it('should throw error when remote API returns error', async () => {
			const { config } = await import('../config.js');
			const originalProvider = config.stt.provider;
			(config.stt as any).provider = 'openai';

			try {
				const mockFetch = vi.fn().mockResolvedValue({
					ok: false,
					statusText: 'Unauthorized'
				});
				global.fetch = mockFetch;

				await expect(SttService.transcribe(mockAudioBuffer)).rejects.toThrow('STT API error: Unauthorized');
			} finally {
				(config.stt as any).provider = originalProvider;
			}
		});
	});
});
