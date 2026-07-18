import { userState } from '$lib/state/user.svelte';

export interface RagDocument {
	document_id: string;
	owner_id: string;
	source: 'file' | 'chat' | 'web';
	title: string;
	source_ref?: string;
	mime_type?: string;
	chunk_count: number;
	status: 'pending' | 'indexed' | 'error';
	error?: string;
	created_at: number;
	updated_at?: number;
}

function baseUrl(): string {
	return userState.preferences.serverUrl.replace(/\/$/, '');
}

function ownerId(): string {
	return userState.uid || 'anonymous';
}

export const ragService = {
	async listDocuments(): Promise<RagDocument[]> {
		const res = await fetch(`${baseUrl()}/api/rag/documents?owner_id=${encodeURIComponent(ownerId())}`);
		if (!res.ok) throw new Error('Failed to list documents');
		return res.json();
	},

	async uploadFile(file: File): Promise<RagDocument> {
		const form = new FormData();
		form.append('file', file);
		form.append('owner_id', ownerId());
		const res = await fetch(`${baseUrl()}/api/rag/documents`, { method: 'POST', body: form });
		if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Upload failed');
		return res.json();
	},

	async ingestUrl(url: string): Promise<RagDocument> {
		const res = await fetch(`${baseUrl()}/api/rag/documents/web`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ owner_id: ownerId(), url })
		});
		if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Ingestion failed');
		return res.json();
	},

	async ingestChat(chatId: string): Promise<RagDocument> {
		const res = await fetch(`${baseUrl()}/api/rag/documents/chat/${encodeURIComponent(chatId)}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ owner_id: ownerId() })
		});
		if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Ingestion failed');
		return res.json();
	},

	async deleteDocument(documentId: string): Promise<void> {
		const res = await fetch(
			`${baseUrl()}/api/rag/documents/${encodeURIComponent(documentId)}?owner_id=${encodeURIComponent(ownerId())}`,
			{ method: 'DELETE' }
		);
		if (!res.ok) throw new Error('Delete failed');
	}
};
