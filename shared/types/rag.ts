/** Where an indexed document came from. */
export type DocumentSource = 'file' | 'chat' | 'web';
/** Indexing state of a document. `error` carries the reason in `RagDocument.error`. */
export type DocumentStatus = 'pending' | 'indexed' | 'error';

/** A document in the RAG store, tracked separately from its chunks. */
export interface RagDocument {
	document_id: string;
	owner_id: string;
	source: DocumentSource;
	title: string;
	source_ref?: string;
	mime_type?: string;
	chunk_count: number;
	status: DocumentStatus;
	error?: string;
	created_at: number;
	updated_at?: number;
}

/**
 * One embedded slice of a document. `position` is the chunk's order within its
 * document; `embedding_model` records which model produced the vector, so a model
 * change can be detected and the document re-indexed.
 */
export interface RagDocumentChunk {
	chunk_id: string;
	document_id: string;
	owner_id: string;
	text: string;
	position: number;
	embedding_model: string;
	created_at: number;
}

/** A chunk returned by a similarity search, with its `score` (higher is closer). */
export interface RagRetrievedChunk {
	chunk_id: string;
	document_id: string;
	text: string;
	score: number;
}
