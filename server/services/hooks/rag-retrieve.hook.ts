import type { HookHandler } from '../../../shared/types/hooks.js';
import { retrieveContext, formatContextBlock } from '../rag/retrieve.js';
import { logger } from '../../utils/logger.js';

/**
 * Built-in pre-send hook: retrieves the top-k relevant chunks from the
 * user's RAG knowledge base and appends them as context to the user message.
 * Fails open — a retrieval error must never block the chat pipeline.
 */
export const ragRetrieveHook: HookHandler = async (ctx) => {
	const start = Date.now();
	try {
		const chunks = await retrieveContext(ctx.user_id, ctx.message.content);
		if (chunks.length > 0) {
			const block = formatContextBlock(chunks);
			ctx.message.content = `${ctx.message.content}\n\n${block}`;
		}
		ctx.hook_log.push({
			hook_id: 'builtin:rag-retrieve',
			event: ctx.event,
			duration_ms: Date.now() - start,
			mutated: chunks.length > 0
		});
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		logger.warn('RAG', `rag-retrieve hook failed: ${error}`);
		ctx.hook_log.push({
			hook_id: 'builtin:rag-retrieve',
			event: ctx.event,
			duration_ms: Date.now() - start,
			mutated: false,
			error
		});
	}
	return ctx;
};
