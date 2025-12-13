export interface ThinkingResult {
	pre: string | null;
	thinking: string | null;
	response: string | null;
	isThinking: boolean;
}

export function parseThinking(content: string | null | undefined): ThinkingResult {
	if (!content || typeof content !== 'string') {
		return { pre: null, thinking: null, response: content || '', isThinking: false };
	}

	const thinkStart = content.indexOf('<think>');
	if (thinkStart === -1) {
		return { pre: null, thinking: null, response: content, isThinking: false };
	}

	const pre = content.substring(0, thinkStart);
	const thinkEnd = content.indexOf('</think>');

	if (thinkEnd === -1) {
		// Still thinking, no closing tag yet
		const thinkContent = content.substring(thinkStart + 7);
		return { pre, thinking: thinkContent, response: null, isThinking: true };
	}

	// Finished thinking
	const thinkContent = content.substring(thinkStart + 7, thinkEnd);
	const restContent = content.substring(thinkEnd + 8);
	return { pre, thinking: thinkContent, response: restContent, isThinking: false };
}
