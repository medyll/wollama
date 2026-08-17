import { randomUUID } from 'crypto';
import { config } from '../config.js';
import { sanitizeOllamaResponse } from '../services/ollama-response.js';
import { ollamaProvider } from './ollama.provider.js';
import { toolCatalog } from './tool-catalog.js';
import { toolExecutor } from './tool-executor.js';
import { runManager } from './run-manager.js';
import { ACP_TEAM_SERVER_ID } from '../mcp/acp-team.constants.js';
import type { ExecutionContext, ProviderAdapter, StreamSink, ToolCallRequest, ToolResult, WollamaEvent } from './types.js';

// A model-issued `agent_start` call is routed to runManager (a supervised, persisted
// run) instead of a single MCP round trip via toolExecutor — see M4 in
// docs/architecture/mcp-client-acp-team-investigation.md and the implementation plan.
const AGENT_START_TOOL_ID = `mcp:${ACP_TEAM_SERVER_ID}:agent_start`;

export interface RunChatRequest {
	model: string;
	messages: unknown[];
	stream: boolean;
	ctx: ExecutionContext;
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Merges eval/duration counters from a later-turn `done` chunk onto the accumulator,
 *  so the single final chunk emitted to the client reflects the whole multi-turn call. */
function accumulateDoneMetrics(acc: Record<string, unknown>, raw: unknown): Record<string, unknown> {
	if (!isRecord(raw)) return acc;
	const merged = { ...acc };
	for (const key of [
		'eval_count',
		'prompt_eval_count',
		'total_duration',
		'eval_duration',
		'prompt_eval_duration',
		'load_duration'
	]) {
		const prev = typeof acc[key] === 'number' ? (acc[key] as number) : 0;
		const cur = typeof raw[key] === 'number' ? (raw[key] as number) : 0;
		merged[key] = prev + cur;
	}
	// Non-numeric fields (model, created_at, done, done_reason, message) come from the
	// final turn's own chunk, applied by the caller after merging counters.
	return merged;
}

function wollamaEvent(event: WollamaEvent) {
	return { wollama: event };
}

/**
 * Runs a chat turn against a ProviderAdapter, looping through model-issued tool calls
 * until the model stops requesting them or `config.tools.maxIterations` is hit.
 *
 * Kept express-free (StreamSink instead of `res`) so the loop is unit-testable without
 * an HTTP server.
 */
export function createConversationOrchestrator(provider: ProviderAdapter = ollamaProvider) {
	return {
		async runChat(req: RunChatRequest, sink?: StreamSink): Promise<unknown | void> {
			const messages = [...req.messages];
			const maxIterations = config.tools.maxIterations;
			let metricsAcc: Record<string, unknown> = {};
			let lastNonToolChunkRaw: unknown;

			for (let turn = 1; turn <= maxIterations; turn++) {
				const descriptors = await toolCatalog.list(req.ctx);
				const providerTurn = await provider.chat({
					model: req.model,
					messages,
					tools: descriptors.length > 0 ? descriptors : undefined,
					stream: req.stream
				});

				const pending: ToolCallRequest[] = [];
				let finalRaw: unknown;

				for await (const chunk of providerTurn.stream) {
					if (chunk.kind === 'tool_calls') {
						pending.push(...chunk.calls);
						continue; // never forward the raw tool_calls chunk to the client
					}
					if (chunk.kind === 'done') {
						metricsAcc = accumulateDoneMetrics(metricsAcc, chunk.raw);
						const isFinalTurn = pending.length === 0 || turn >= maxIterations;
						if (!isFinalTurn) {
							// Suppress intermediate `done: true` — the client finalizes the
							// message on the first one it sees.
							continue;
						}
						finalRaw = isRecord(chunk.raw) ? { ...chunk.raw, ...metricsAcc } : chunk.raw;
						if (sink) sink.writeChunk(sanitizeOllamaResponse(finalRaw));
						break;
					}
					// text
					if (sink) sink.writeChunk(sanitizeOllamaResponse(chunk.raw));
					lastNonToolChunkRaw = chunk.raw;
				}

				if (pending.length === 0) {
					if (!req.stream) return sanitizeOllamaResponse(finalRaw ?? lastNonToolChunkRaw);
					sink?.end();
					return;
				}

				if (turn >= maxIterations) {
					// Ran out of iterations with tool calls still pending — the `done`
					// chunk above already closed the stream to the client.
					if (!req.stream) return sanitizeOllamaResponse(finalRaw ?? lastNonToolChunkRaw);
					sink?.end();
					return;
				}

				// Execute tool calls. Sequential unless every call is 'read' risk — the
				// catalog carries risk per descriptor, resolved inside toolExecutor.
				const results: ToolResult[] = [];
				for (const call of pending) {
					const tool_call_id = randomUUID();
					const descriptor = await toolCatalog.resolveWireName(call.wireName, req.ctx);
					if (sink && descriptor) {
						sink.writeChunk(
							wollamaEvent({
								type: 'tool_call',
								tool_call_id,
								tool_id: descriptor.id,
								risk: descriptor.risk,
								input: call.args
							})
						);
					}
					const result =
						descriptor?.id === AGENT_START_TOOL_ID
							? await runManager.startFromToolCall(call.args, req.ctx, { tool_call_id })
							: await toolExecutor.execute(call, req.ctx, {
									onPermissionRequest: (evt) => {
										sink?.writeChunk(wollamaEvent({ type: 'permission_request', ...evt }));
									}
								});
					results.push(result);
					if (sink) {
						const runId = typeof result.data?.run_id === 'string' ? result.data.run_id : undefined;
						sink.writeChunk(
							wollamaEvent({
								type: 'tool_result',
								tool_call_id,
								ok: result.ok,
								summary: result.content.slice(0, 200),
								...(runId ? { run_id: runId } : {})
							})
						);
					}
				}

				messages.push(...provider.buildToolMessages(pending, results));
				// loop continues to the next turn
			}

			if (!req.stream) return sanitizeOllamaResponse(lastNonToolChunkRaw);
			sink?.end();
		}
	};
}

export const conversationOrchestrator = createConversationOrchestrator();
