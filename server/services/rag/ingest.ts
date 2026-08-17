import { randomUUID } from 'crypto';
import { dbManager } from '../../db/database.js';
import { config } from '../../config.js';
import { logger } from '../../utils/logger.js';
import { chunkText } from './chunker.js';
import { embedBatch } from './embed.js';
import { vectorStore } from './vector-store.js';
import type { RagDocument, RagDocumentChunk, DocumentSource } from '../../../shared/types/rag.js';

export interface IngestParams {
	ownerId: string;
	source: DocumentSource;
	title: string;
	text: string;
	sourceRef?: string;
	mimeType?: string;
}

export async function ingestDocument(params: IngestParams): Promise<RagDocument> {
	const { ownerId, source, title, text, sourceRef, mimeType } = params;
	const documentsDb = dbManager.getDb('documents');
	const chunksDb = dbManager.getDb('document_chunks');

	const document_id = randomUUID();
	const now = Date.now();

	const document: RagDocument = {
		document_id,
		owner_id: ownerId,
		source,
		title,
		source_ref: sourceRef,
		mime_type: mimeType,
		chunk_count: 0,
		status: 'pending',
		created_at: now
	};
	await documentsDb.put({ ...document, _id: document_id });

	try {
		const chunks = chunkText(text, config.rag.chunkSize, config.rag.chunkOverlap);
		if (chunks.length === 0) {
			throw new Error('No extractable text content');
		}

		const embeddings = await embedBatch(chunks);

		const chunkDocs: RagDocumentChunk[] = chunks.map((chunkTextValue, i) => ({
			chunk_id: randomUUID(),
			document_id,
			owner_id: ownerId,
			text: chunkTextValue,
			position: i,
			embedding_model: config.rag.embedModel,
			created_at: now
		}));

		for (const chunk of chunkDocs) {
			await chunksDb.put({ ...chunk, _id: chunk.chunk_id });
		}

		vectorStore.upsertMany(
			ownerId,
			chunkDocs.map((chunk, i) => ({
				chunk_id: chunk.chunk_id,
				document_id,
				embedding: embeddings[i]
			}))
		);

		const updated: RagDocument = { ...document, chunk_count: chunkDocs.length, status: 'indexed', updated_at: Date.now() };
		const existing = await documentsDb.get(document_id);
		await documentsDb.put({ ...updated, _id: document_id, _rev: existing._rev });
		return updated;
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		logger.error('RAG', `Ingestion failed for document ${document_id}: ${message}`);
		const existing = await documentsDb.get(document_id);
		const failed: RagDocument = { ...document, status: 'error', error: message, updated_at: Date.now() };
		await documentsDb.put({ ...failed, _id: document_id, _rev: existing._rev });
		return failed;
	}
}

export async function deleteDocument(ownerId: string, documentId: string): Promise<void> {
	const documentsDb = dbManager.getDb('documents');
	const chunksDb = dbManager.getDb('document_chunks');

	const chunksResult = await chunksDb.find({ selector: { document_id: documentId, owner_id: ownerId } });
	for (const chunk of chunksResult.docs) {
		await chunksDb.remove(chunk as PouchDB.Core.RemoveDocument);
	}

	vectorStore.removeByDocument(ownerId, documentId);

	try {
		const doc = await documentsDb.get(documentId);
		if ((doc as unknown as RagDocument).owner_id === ownerId) {
			await documentsDb.remove(doc);
		}
	} catch (err) {
		const error = err as { status?: number };
		if (error.status !== 404) throw err;
	}
}
