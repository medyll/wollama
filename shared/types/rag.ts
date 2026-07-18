export type DocumentSource = 'file' | 'chat' | 'web';
export type DocumentStatus = 'pending' | 'indexed' | 'error';

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

export interface RagDocumentChunk {
	chunk_id: string;
	document_id: string;
	owner_id: string;
	text: string;
	position: number;
	embedding_model: string;
	created_at: number;
}

export interface RagRetrievedChunk {
	chunk_id: string;
	document_id: string;
	text: string;
	score: number;
}
