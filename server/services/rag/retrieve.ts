import { dbManager } from '../../db/database.js';
import { config } from '../../config.js';
import { embedText } from './embed.js';
import { vectorStore } from './vector-store.js';
import type { RagDocumentChunk, RagRetrievedChunk } from '../../../shared/types/rag.js';

export async function retrieveContext(ownerId: string, query: string): Promise<RagRetrievedChunk[]> {
	if (!ownerId || !query.trim()) return [];

	const queryEmbedding = await embedText(query);
	const hits = vectorStore.search(ownerId, queryEmbedding, config.rag.topK, config.rag.minScore);
	if (hits.length === 0) return [];

	const chunksDb = dbManager.getDb('document_chunks');
	const results: RagRetrievedChunk[] = [];
	for (const hit of hits) {
		try {
			const chunk = (await chunksDb.get(hit.chunk_id)) as unknown as RagDocumentChunk;
			results.push({ chunk_id: hit.chunk_id, document_id: hit.document_id, text: chunk.text, score: hit.score });
		} catch {
			// chunk metadata missing (deleted out-of-band); skip
		}
	}
	return results;
}

export function formatContextBlock(chunks: RagRetrievedChunk[]): string {
	if (chunks.length === 0) return '';
	const lines = chunks.map((c, i) => `[${i + 1}] ${c.text}`);
	return `Relevant context from your knowledge base:\n${lines.join('\n\n')}`;
}
