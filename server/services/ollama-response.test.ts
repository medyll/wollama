import { describe, expect, it } from 'vitest';
import { sanitizeOllamaResponse } from './ollama-response.js';

describe('sanitizeOllamaResponse', () => {
	it('removes private thinking while preserving the visible message', () => {
		expect(
			sanitizeOllamaResponse({
				model: 'qwen3.5:latest',
				message: { role: 'assistant', thinking: 'private reasoning', content: 'Visible answer' },
				done: false
			})
		).toEqual({
			model: 'qwen3.5:latest',
			message: { role: 'assistant', content: 'Visible answer' },
			done: false
		});
	});

	it('does not mutate the original Ollama response', () => {
		const original = { message: { thinking: 'private', content: 'Visible' } };
		sanitizeOllamaResponse(original);

		expect(original.message.thinking).toBe('private');
	});
});
