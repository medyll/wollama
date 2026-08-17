import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({
	config: {
		ollama: { host: 'http://127.0.0.1:11434', defaultModel: 'test' },
		tools: { enabled: true, maxIterations: 4, autoApprove: ['builtin:web-search'] },
		mcp: { acpTeam: { enabled: false, entry: '', dataDir: '' }, workspaceAllowlist: [], servers: [] }
	}
}));

vi.mock('../db/database.js', () => ({
	dbManager: {
		getDb: () => ({
			put: async () => ({ ok: true }),
			get: async () => {
				throw Object.assign(new Error('not found'), { status: 404 });
			}
		})
	}
}));

import { createConversationOrchestrator } from './conversation-orchestrator.js';
import { toolCatalog } from './tool-catalog.js';
import type {
	ExecutionContext,
	ProviderAdapter,
	ProviderChatRequest,
	ProviderChunk,
	StreamSink,
	ToolCallRequest,
	ToolDescriptor,
	ToolResult,
	ToolRuntime
} from './types.js';

const ctx: ExecutionContext = { origin: 'chat' };

function fakeProvider(chunks: unknown[]): ProviderAdapter & { calls: ProviderChatRequest[] } {
	const calls: ProviderChatRequest[] = [];
	return {
		calls,
		async chat(req) {
			calls.push(req);
			return {
				stream: (async function* () {
					for (const raw of chunks) {
						yield { kind: 'text' as const, delta: '', raw };
					}
				})()
			};
		},
		buildToolMessages() {
			return [];
		}
	};
}

function collectSink() {
	const written: unknown[] = [];
	let ended = false;
	const sink: StreamSink = {
		writeChunk: (o) => written.push(o),
		end: () => {
			ended = true;
		}
	};
	return { sink, written, isEnded: () => ended };
}

describe('conversationOrchestrator (M0 passthrough)', () => {
	beforeEach(() => {
		toolCatalog.unregister('builtin');
		toolCatalog.unregister('acp-team');
	});

	it('sends no `tools` key to the provider when the catalog is empty', async () => {
		const provider = fakeProvider([{ done: true }]);
		const orchestrator = createConversationOrchestrator(provider);
		const { sink } = collectSink();

		await orchestrator.runChat({ model: 'm', messages: [], stream: true, ctx }, sink);

		expect(provider.calls).toHaveLength(1);
		expect(provider.calls[0].tools).toBeUndefined();
	});

	it('forwards chunks to the sink byte-identical to the provider raw output, then ends', async () => {
		const rawChunks = [
			{ message: { content: 'a' }, done: false },
			{ message: { content: 'b' }, done: true }
		];
		const provider = fakeProvider(rawChunks);
		const orchestrator = createConversationOrchestrator(provider);
		const { sink, written, isEnded } = collectSink();

		await orchestrator.runChat({ model: 'm', messages: [], stream: true, ctx }, sink);

		expect(written).toEqual(rawChunks);
		expect(isEnded()).toBe(true);
	});

	it('non-streaming mode returns the sanitized last chunk without a sink', async () => {
		const provider = fakeProvider([{ message: { content: 'x', thinking: 'secret' }, done: true }]);
		const orchestrator = createConversationOrchestrator(provider);

		const result = await orchestrator.runChat({ model: 'm', messages: [], stream: false, ctx });

		expect(result).toEqual({ message: { content: 'x' }, done: true });
	});
});

describe('conversationOrchestrator (M1 tool loop)', () => {
	function toolDescriptor(): ToolDescriptor {
		return {
			id: 'builtin:web-search',
			serverId: 'builtin',
			name: 'web-search',
			wireName: 'builtin__web_search',
			inputSchema: { type: 'object' },
			risk: 'read'
		};
	}

	function fakeRuntime(descriptor: ToolDescriptor, result: ToolResult): ToolRuntime & { calls: unknown[] } {
		const calls: unknown[] = [];
		return {
			serverId: descriptor.serverId,
			calls,
			async list() {
				return [descriptor];
			},
			async call(_toolId, input) {
				calls.push(input);
				return result;
			}
		};
	}

	/** A two-turn provider: turn 1 emits a tool call then done; turn 2 emits text then done. */
	function twoTurnProvider(): ProviderAdapter & { calls: ProviderChatRequest[] } {
		const calls: ProviderChatRequest[] = [];
		let turn = 0;
		return {
			calls,
			async chat(req) {
				calls.push(req);
				turn++;
				const chunks: ProviderChunk[] =
					turn === 1
						? [
								{
									kind: 'tool_calls',
									calls: [{ wireName: 'builtin__web_search', args: { query: 'q' } }],
									raw: { done: false }
								},
								{ kind: 'done', raw: { done: true, eval_count: 3 } }
							]
						: [
								{ kind: 'text', delta: 'hello', raw: { message: { content: 'hello' }, done: false } },
								{ kind: 'text', delta: ' world', raw: { message: { content: ' world' }, done: false } },
								{ kind: 'done', raw: { done: true, eval_count: 7 } }
							];
				return {
					stream: (async function* () {
						for (const c of chunks) yield c;
					})()
				};
			},
			buildToolMessages(calls: ToolCallRequest[], results: ToolResult[]) {
				return [
					{
						role: 'assistant',
						content: '',
						tool_calls: calls.map((c) => ({ function: { name: c.wireName, arguments: c.args } }))
					},
					...results.map((r, i) => ({ role: 'tool', tool_name: calls[i].wireName, content: r.content }))
				];
			}
		};
	}

	beforeEach(() => {
		toolCatalog.unregister('builtin');
		toolCatalog.unregister('acp-team');
	});

	it('runs exactly two provider turns, suppresses the intermediate done, and reports one tool_call/tool_result pair', async () => {
		const descriptor = toolDescriptor();
		const runtime = fakeRuntime(descriptor, { ok: true, content: 'search results' });
		toolCatalog.register(runtime);

		const provider = twoTurnProvider();
		const orchestrator = createConversationOrchestrator(provider);
		const { sink, written, isEnded } = collectSink();

		await orchestrator.runChat(
			{ model: 'm', messages: [{ role: 'user', content: 'search please' }], stream: true, ctx },
			sink
		);

		expect(provider.calls).toHaveLength(2);
		expect(runtime.calls).toEqual([{ query: 'q' }]);

		// Exactly one `done: true` chunk reaches the sink.
		const doneChunks = written.filter((c: any) => c && typeof c === 'object' && 'done' in c && c.done === true);
		expect(doneChunks).toHaveLength(1);

		// wollama tool_call / tool_result events were emitted.
		const wollamaEvents = written.filter((c: any) => c && typeof c === 'object' && 'wollama' in c).map((c: any) => c.wollama);
		expect(wollamaEvents.find((e: any) => e.type === 'tool_call')).toBeTruthy();
		expect(wollamaEvents.find((e: any) => e.type === 'tool_result' && e.ok === true)).toBeTruthy();

		// The 2nd provider call's messages end with an assistant tool_calls message
		// followed by a tool-role message.
		const secondCallMessages = provider.calls[1].messages as any[];
		const last2 = secondCallMessages.slice(-2);
		expect(last2[0]).toMatchObject({ role: 'assistant', tool_calls: [{ function: { name: 'builtin__web_search' } }] });
		expect(last2[1]).toMatchObject({ role: 'tool', tool_name: 'builtin__web_search', content: 'search results' });

		expect(isEnded()).toBe(true);
	});
});
