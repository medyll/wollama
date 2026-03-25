import type { HookHandler } from '../../../shared/types/hooks.js';

/**
 * Built-in pre-send hook: appends current date/time to the last user message.
 * Helps the LLM stay temporally aware without modifying the system prompt.
 */
export const injectDatetimeHook: HookHandler = async (ctx) => {
	const now = new Date().toLocaleString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZoneName: 'short'
	});

	const original = ctx.message.content;
	ctx.message.content = `${original}\n\n[Context: ${now}]`;

	ctx.hook_log.push({
		hook_id: 'builtin:inject-datetime',
		event: ctx.event,
		duration_ms: 0,
		mutated: true
	});

	return ctx;
};
