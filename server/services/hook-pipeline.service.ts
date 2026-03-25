import { hookRegistry } from './hook-registry.service.js';
import { injectDatetimeHook } from './hooks/inject-datetime.hook.js';
import { trimWhitespaceHook } from './hooks/trim-whitespace.hook.js';
import { logger } from '../utils/logger.js';
import type { HookContext, HookEvent, HookHandler, Hook } from '../../shared/types/hooks.js';

/** Map of builtin handler_ref → HookHandler implementations */
const BUILTIN_HANDLERS = new Map<string, HookHandler>([
	['inject-datetime', injectDatetimeHook],
	['trim-whitespace', trimWhitespaceHook]
]);

/**
 * Runs all registered hooks for a given event serially, in priority order.
 * Each hook receives the HookContext mutated by the previous hook.
 * Failures are isolated: a failing hook logs an error and passes ctx unchanged.
 */
async function runEvent(event: HookEvent, ctx: HookContext): Promise<HookContext> {
	const hooks = hookRegistry.getForEvent(event);
	if (hooks.length === 0) return ctx;

	for (const hook of hooks) {
		const start = Date.now();
		try {
			const handler = resolveHandler(hook);
			if (!handler) {
				logger.warn('HOOKS', `No handler found for hook "${hook.name}" (ref: ${hook.handler_ref})`);
				continue;
			}
			ctx = await handler(ctx);
		} catch (err) {
			const duration_ms = Date.now() - start;
			const error = err instanceof Error ? err.message : String(err);
			logger.warn('HOOKS', `Hook "${hook.name}" failed: ${error}`);
			ctx.hook_log.push({
				hook_id: hook.hook_id,
				event,
				duration_ms,
				mutated: false,
				error
			});

			if (hook.config?.blocking === true) {
				throw err;
			}
		}
	}

	return ctx;
}

function resolveHandler(hook: Hook): HookHandler | undefined {
	if (hook.handler_type === 'builtin') {
		return BUILTIN_HANDLERS.get(hook.handler_ref);
	}
	// 'llm' and 'skill' handler types will be implemented in Sprint 3+
	return undefined;
}

export const hookPipeline = {
	/**
	 * Run hooks for the given event.
	 * Returns the (potentially mutated) HookContext.
	 */
	run: runEvent,

	/**
	 * Convenience: create a baseline HookContext for a user message.
	 */
	createContext(params: {
		event: HookEvent;
		chat_id: string;
		user_id: string;
		companion_id?: string;
		content: string;
		role?: HookContext['message']['role'];
		skill_invoked?: string;
	}): HookContext {
		return {
			event: params.event,
			chat_id: params.chat_id,
			user_id: params.user_id,
			companion_id: params.companion_id,
			message: {
				content: params.content,
				role: params.role ?? 'user',
				skill_invoked: params.skill_invoked
			},
			session_metadata: {},
			hook_log: []
		};
	}
};
