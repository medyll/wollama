import fs from 'fs';
import path from 'path';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';

interface VectorRecord {
	chunk_id: string;
	document_id: string;
	embedding: number[];
}

/**
 * Flat, brute-force cosine-similarity vector index, one file per user.
 * Fine up to tens of thousands of chunks per user; swap for a real ANN
 * index later if a corpus grows past that without changing the call sites
 * in ingest.ts / retrieve.ts.
 */
class VectorStore {
	private cache = new Map<string, VectorRecord[]>();

	private filePath(ownerId: string): string {
		return path.join(config.rag.vectorDir, `${ownerId}.json`);
	}

	private load(ownerId: string): VectorRecord[] {
		const cached = this.cache.get(ownerId);
		if (cached) return cached;

		const file = this.filePath(ownerId);
		let records: VectorRecord[] = [];
		if (fs.existsSync(file)) {
			try {
				records = JSON.parse(fs.readFileSync(file, 'utf-8'));
			} catch (err) {
				logger.error('RAG', `Failed to read vector store for ${ownerId}: ${err}`);
			}
		}
		this.cache.set(ownerId, records);
		return records;
	}

	private persist(ownerId: string): void {
		if (!fs.existsSync(config.rag.vectorDir)) {
			fs.mkdirSync(config.rag.vectorDir, { recursive: true });
		}
		const records = this.cache.get(ownerId) ?? [];
		fs.writeFileSync(this.filePath(ownerId), JSON.stringify(records));
	}

	upsertMany(ownerId: string, entries: VectorRecord[]): void {
		const records = this.load(ownerId);
		records.push(...entries);
		this.cache.set(ownerId, records);
		this.persist(ownerId);
	}

	removeByDocument(ownerId: string, documentId: string): void {
		const records = this.load(ownerId).filter((r) => r.document_id !== documentId);
		this.cache.set(ownerId, records);
		this.persist(ownerId);
	}

	search(ownerId: string, queryEmbedding: number[], topK: number, minScore: number): Array<{ chunk_id: string; document_id: string; score: number }> {
		const records = this.load(ownerId);
		const scored = records.map((r) => ({
			chunk_id: r.chunk_id,
			document_id: r.document_id,
			score: cosineSimilarity(queryEmbedding, r.embedding)
		}));
		scored.sort((a, b) => b.score - a.score);
		return scored.filter((s) => s.score >= minScore).slice(0, topK);
	}
}

function cosineSimilarity(a: number[], b: number[]): number {
	let dot = 0;
	let normA = 0;
	let normB = 0;
	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}
	if (normA === 0 || normB === 0) return 0;
	return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const vectorStore = new VectorStore();
