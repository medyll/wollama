import { OllamaService } from '../services/ollama.service.js';
import type {
	ProviderAdapter,
	ProviderChatRequest,
	ProviderChunk,
	ProviderTurn,
	ToolCallRequest,
	ToolDescriptor,
	ToolResult
} from './types.js';

function toOllamaTools(tools: ToolDescriptor[]): Record<string, unknown>[] {
	return tools.map((t) => ({
		type: 'function',
		function: {
			name: t.wireName,
			description: t.description,
			parameters: t.inputSchema
		}
	}));
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Normalizes one raw ollama chat chunk into a ProviderChunk. tool_calls arrive whole
 *  (ollama's ToolCall.function.arguments is a plain object, not a partial JSON string),
 *  so no cross-chunk accumulation is needed here — see M1 spike note in the plan. */
function normalizeChunk(raw: unknown): ProviderChunk {
	if (!isRecord(raw)) return { kind: 'done', raw };
	const message = isRecord(raw.message) ? raw.message : undefined;
	const toolCalls = message && Array.isArray(message.tool_calls) ? message.tool_calls : undefined;

	if (toolCalls && toolCalls.length > 0) {
		const calls: ToolCallRequest[] = toolCalls
			.filter(isRecord)
			.map((tc) => {
				const fn = isRecord(tc.function) ? tc.function : {};
				return {
					wireName: typeof fn.name === 'string' ? fn.name : '',
					args: isRecord(fn.arguments) ? fn.arguments : {}
				};
			})
			.filter((c) => c.wireName);
		if (calls.length > 0) return { kind: 'tool_calls', calls, raw };
	}

	if (raw.done === true) return { kind: 'done', raw };

	const content = message && typeof message.content === 'string' ? message.content : '';
	return { kind: 'text', delta: content, raw };
}

async function* normalizeStream(response: AsyncIterable<unknown>): AsyncIterable<ProviderChunk> {
	for await (const part of response) {
		yield normalizeChunk(part);
	}
}

export const ollamaProvider: ProviderAdapter = {
	async chat(req: ProviderChatRequest): Promise<ProviderTurn> {
		const payload: Record<string, unknown> = {
			model: req.model,
			messages: req.messages,
			stream: req.stream
		};
		if (req.tools && req.tools.length > 0) {
			payload.tools = toOllamaTools(req.tools);
		}
		const response = await OllamaService.chat(payload);
		if (req.stream) {
			return { stream: normalizeStream(response as AsyncIterable<unknown>) };
		}
		// Non-streaming: wrap the single response as a one-chunk async iterable.
		return {
			stream: (async function* () {
				yield normalizeChunk(response);
			})()
		};
	},

	buildToolMessages(calls: ToolCallRequest[], results: ToolResult[]): unknown[] {
		return [
			{
				role: 'assistant',
				content: '',
				tool_calls: calls.map((c) => ({ function: { name: c.wireName, arguments: c.args } }))
			},
			...results.map((r, i) => ({
				role: 'tool',
				tool_name: calls[i]?.wireName,
				content: r.content
			}))
		];
	}
};
