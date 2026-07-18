import express from 'express';
import multer from 'multer';
import { dbManager } from '../db/database.js';
import { ingestDocument, deleteDocument } from '../services/rag/ingest.js';
import PageFetchAgent from '../agents/page-fetch.agent.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function extractFileText(file: Express.Multer.File): Promise<string> {
	if (file.mimetype === 'application/pdf') {
		const { default: pdfParse } = await import('pdf-parse');
		const result = await pdfParse(file.buffer);
		return result.text;
	}
	return file.buffer.toString('utf-8');
}

// GET /api/rag/documents?owner_id=...
router.get('/documents', async (req, res) => {
	const ownerId = req.query.owner_id as string;
	if (!ownerId) {
		res.status(400).json({ error: 'owner_id is required' });
		return;
	}
	try {
		const db = dbManager.getDb('documents');
		const result = await db.find({ selector: { owner_id: ownerId }, sort: undefined, limit: 200 });
		res.json(result.docs);
	} catch (error) {
		console.error('GET /api/rag/documents error', error);
		res.status(500).json({ error: 'Failed to list documents' });
	}
});

// POST /api/rag/documents  (multipart: file, owner_id)
router.post('/documents', upload.single('file'), async (req, res) => {
	try {
		const ownerId = req.body.owner_id as string;
		if (!ownerId) {
			res.status(400).json({ error: 'owner_id is required' });
			return;
		}
		if (!req.file) {
			res.status(400).json({ error: 'No file uploaded' });
			return;
		}

		const text = await extractFileText(req.file);
		const document = await ingestDocument({
			ownerId,
			source: 'file',
			title: req.file.originalname,
			text,
			sourceRef: req.file.originalname,
			mimeType: req.file.mimetype
		});
		res.json(document);
	} catch (error) {
		console.error('POST /api/rag/documents error', error);
		res.status(500).json({ error: 'Ingestion failed' });
	}
});

// POST /api/rag/documents/web  { owner_id, url }
router.post('/documents/web', async (req, res) => {
	try {
		const { owner_id: ownerId, url } = req.body;
		if (!ownerId || !url) {
			res.status(400).json({ error: 'owner_id and url are required' });
			return;
		}

		const fetched = await PageFetchAgent.run({ url });
		if (fetched.error || !fetched.content) {
			res.status(422).json({ error: fetched.error || 'No content extracted from URL' });
			return;
		}

		const document = await ingestDocument({
			ownerId,
			source: 'web',
			title: url,
			text: fetched.content,
			sourceRef: url,
			mimeType: 'text/html'
		});
		res.json(document);
	} catch (error) {
		console.error('POST /api/rag/documents/web error', error);
		res.status(500).json({ error: 'Ingestion failed' });
	}
});

// POST /api/rag/documents/chat/:chatId  { owner_id }
router.post('/documents/chat/:chatId', async (req, res) => {
	try {
		const { chatId } = req.params;
		const ownerId = req.body.owner_id as string;
		if (!ownerId) {
			res.status(400).json({ error: 'owner_id is required' });
			return;
		}

		const messagesDb = dbManager.getDb('messages');
		const result = await messagesDb.find({
			selector: { chat_id: chatId },
			sort: undefined,
			limit: 5000
		});
		const messages = (result.docs as any[]).sort((a, b) => a.created_at - b.created_at);
		if (messages.length === 0) {
			res.status(404).json({ error: 'No messages found for this chat' });
			return;
		}

		const text = messages.map((m) => `${m.role}: ${m.content}`).join('\n\n');
		const document = await ingestDocument({
			ownerId,
			source: 'chat',
			title: `Chat ${chatId}`,
			text,
			sourceRef: chatId
		});
		res.json(document);
	} catch (error) {
		console.error('POST /api/rag/documents/chat/:chatId error', error);
		res.status(500).json({ error: 'Ingestion failed' });
	}
});

// DELETE /api/rag/documents/:id?owner_id=...
router.delete('/documents/:id', async (req, res) => {
	try {
		const ownerId = req.query.owner_id as string;
		if (!ownerId) {
			res.status(400).json({ error: 'owner_id is required' });
			return;
		}
		await deleteDocument(ownerId, req.params.id);
		res.json({ success: true });
	} catch (error) {
		console.error('DELETE /api/rag/documents/:id error', error);
		res.status(500).json({ error: 'Delete failed' });
	}
});

export default router;
