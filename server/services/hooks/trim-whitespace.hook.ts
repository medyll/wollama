import type { HookHandler } from '../../../shared/types/hooks.js';

/**
 * Built-in post-receive hook: trims leading/trailing whitespace
 * and collapses sequences of 3+ blank lines into a single blank line.
 */
export const trimWhitespaceHook: HookHandler = async (ctx) => {
	const original = ctx.message.content;
	const trimmed = original.trim().replace(/\n{3,}/g, '\n\n');
	const mutated = trimmed !== original;

	ctx.message.content = trimmed;
	ctx.hook_log.push({
		hook_id: 'builtin:trim-whitespace',
		event: ctx.event,
		duration_ms: 0,
		mutated
	});

	return ctx;
};
