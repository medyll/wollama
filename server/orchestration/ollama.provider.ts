import { OllamaService } from '../services/ollama.service.js';
import { config } from '../config.js';
import { NO_CAPABILITIES } from '../../shared/types/provider.js';
import type { ProviderCapabilities, ProviderModel } from '../../shared/types/provider.js';
import type {
	LlmProvider,
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

const OLLAMA_CAPABILITIES: ProviderCapabilities = {
	...NO_CAPABILITIES,
	streaming: true,
	tools: true,
	embeddings: true,
	modelManagement: true,
	// Per-model in reality (llava yes, mistral no); true here means the transport
	// carries images, which is what the client needs to decide whether to offer
	// an attach button at all.
	vision: true,
	systemPrompt: true
};

/** Maps ollama's own model records to ProviderModel while keeping the raw record,
 *  which existing consumers of /api/models still read (size, digest, details). */
function toProviderModels(list: unknown): ProviderModel[] {
	const models = isRecord(list) && Array.isArray(list.models) ? list.models : [];
	return models.filter(isRecord).map((m) => {
		const name = typeof m.name === 'string' ? m.name : typeof m.model === 'string' ? m.model : '';
		return { id: name, label: name, providerId: 'ollama', raw: m };
	});
}

export const ollamaProvider: LlmProvider = {
	id: 'ollama',
	type: 'ollama',
	family: 'http',
	label: 'Ollama',
	capabilities: OLLAMA_CAPABILITIES,

	async isAvailable(): Promise<boolean> {
		try {
			await OllamaService.list();
			return true;
		} catch {
			return false;
		}
	},

	async listModels(): Promise<ProviderModel[]> {
		return toProviderModels(await OllamaService.list());
	},

	async embed(input: string[]): Promise<number[][]> {
		const result = (await OllamaService.embed({
			model: config.rag.embedModel,
			input
		})) as { embeddings?: number[][] };
		if (!result?.embeddings) throw new Error('Ollama returned no embeddings');
		return result.embeddings;
	},

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
