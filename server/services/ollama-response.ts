function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function sanitizeOllamaResponse(response: unknown): unknown {
	if (!isRecord(response)) return response;

	const sanitizedResponse = { ...response };
	if (isRecord(sanitizedResponse.message)) {
		const sanitizedMessage = { ...sanitizedResponse.message };
		delete sanitizedMessage.thinking;
		sanitizedResponse.message = sanitizedMessage;
	}

	return sanitizedResponse;
}
