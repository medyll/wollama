import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../services/ollama.service.js', () => ({
	OllamaService: { chat: vi.fn() }
}));

import { ollamaProvider } from './ollama.provider.js';
import { OllamaService } from '../services/ollama.service.js';
import type { ToolDescriptor } from './types.js';

const mockChat = vi.mocked(OllamaService.chat);

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
	const out: T[] = [];
	for await (const x of iter) out.push(x);
	return out;
}

beforeEach(() => vi.clearAllMocks());

describe('ollamaProvider.chat', () => {
	it('omits `tools` when none are given', async () => {
		mockChat.mockResolvedValue((async function* () {})());
		await ollamaProvider.chat({ model: 'm', messages: [], stream: true });
		expect(mockChat).toHaveBeenCalledWith(expect.not.objectContaining({ tools: expect.anything() }));
	});

	it('maps ToolDescriptors to ollama function-tool shape', async () => {
		mockChat.mockResolvedValue((async function* () {})());
		const tools: ToolDescriptor[] = [
			{
				id: 'builtin:web-search',
				serverId: 'builtin',
				name: 'web-search',
				wireName: 'mcp__builtin__web_search',
				description: 'search',
				inputSchema: { type: 'object' },
				risk: 'external'
			}
		];
		await ollamaProvider.chat({ model: 'm', messages: [], tools, stream: true });
		expect(mockChat).toHaveBeenCalledWith(
			expect.objectContaining({
				tools: [
					{
						type: 'function',
						function: { name: 'mcp__builtin__web_search', description: 'search', parameters: { type: 'object' } }
					}
				]
			})
		);
	});

	it('normalizes a streamed tool_calls chunk without cross-chunk accumulation', async () => {
		mockChat.mockResolvedValue(
			(async function* () {
				yield {
					message: { role: 'assistant', tool_calls: [{ function: { name: 'x', arguments: { a: 1 } } }] },
					done: false
				};
				yield { done: true, eval_count: 5 };
			})()
		);
		const turn = await ollamaProvider.chat({ model: 'm', messages: [], stream: true });
		const chunks = await collect(turn.stream);
		expect(chunks[0]).toEqual({ kind: 'tool_calls', calls: [{ wireName: 'x', args: { a: 1 } }], raw: expect.anything() });
		expect(chunks[1].kind).toBe('done');
	});

	it('normalizes text chunks', async () => {
		mockChat.mockResolvedValue(
			(async function* () {
				yield { message: { content: 'hi' }, done: false };
			})()
		);
		const turn = await ollamaProvider.chat({ model: 'm', messages: [], stream: true });
		const chunks = await collect(turn.stream);
		expect(chunks[0]).toMatchObject({ kind: 'text', delta: 'hi' });
	});
});

describe('ollamaProvider.buildToolMessages', () => {
	it('builds an assistant tool_calls message followed by tool result messages', () => {
		const msgs = ollamaProvider.buildToolMessages([{ wireName: 'x', args: { a: 1 } }], [{ ok: true, content: 'result' }]);
		expect(msgs).toEqual([
			{ role: 'assistant', content: '', tool_calls: [{ function: { name: 'x', arguments: { a: 1 } } }] },
			{ role: 'tool', tool_name: 'x', content: 'result' }
		]);
	});
});
