/**
 * Splits text into overlapping chunks along paragraph, then sentence, boundaries.
 * Token count is approximated as words — good enough for chunk sizing, not exact BPE.
 */
export function chunkText(text: string, chunkSize: number, overlap: number): string[] {
	const normalized = text.replace(/\r\n/g, '\n').trim();
	if (!normalized) return [];

	const paragraphs = normalized
		.split(/\n{2,}/)
		.map((p) => p.trim())
		.filter(Boolean);
	const units = paragraphs.length > 0 ? paragraphs : [normalized];

	const words: string[] = [];
	for (const unit of units) {
		words.push(...unit.split(/\s+/), '\n\n');
	}

	const chunks: string[] = [];
	let start = 0;
	while (start < words.length) {
		const end = Math.min(start + chunkSize, words.length);
		const chunk = words
			.slice(start, end)
			.join(' ')
			.replace(/\s*\n\n\s*/g, '\n\n')
			.trim();
		if (chunk) chunks.push(chunk);
		if (end >= words.length) break;
		start = end - overlap;
		if (start < 0) start = 0;
	}

	return chunks;
}
