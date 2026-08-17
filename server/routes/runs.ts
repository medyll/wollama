import express from 'express';
import { runManager } from '../orchestration/run-manager.js';

const router = express.Router();

// GET /api/runs?chat_id=... — lets a freshly loaded chat rediscover its
// persisted runs before RunTimeline resumes event polling for each one.
router.get('/', async (req, res) => {
	const chatId = typeof req.query.chat_id === 'string' ? req.query.chat_id : '';
	if (!chatId) {
		res.status(400).json({ error: 'chat_id is required' });
		return;
	}
	try {
		res.json(await runManager.listByChat(chatId));
	} catch (err: any) {
		console.error('GET /api/runs error', err);
		res.status(500).json({ error: 'Failed to list runs' });
	}
});

// GET /api/runs/:id
router.get('/:id', async (req, res) => {
	try {
		const run = await runManager.get(req.params.id);
		if (!run) {
			res.status(404).json({ error: 'run not found' });
			return;
		}
		res.json(run);
	} catch (err: any) {
		console.error('GET /api/runs/:id error', err);
		res.status(500).json({ error: 'Failed to fetch run' });
	}
});

// GET /api/runs/:id/events?after=N
router.get('/:id/events', async (req, res) => {
	const after = Number(req.query.after ?? 0);
	try {
		const events = await runManager.events(req.params.id, Number.isFinite(after) ? after : 0);
		res.json(events);
	} catch (err: any) {
		console.error('GET /api/runs/:id/events error', err);
		res.status(500).json({ error: 'Failed to fetch run events' });
	}
});

// POST /api/runs/:id/cancel
router.post('/:id/cancel', async (req, res) => {
	try {
		const run = await runManager.get(req.params.id);
		if (!run) {
			res.status(404).json({ error: 'run not found' });
			return;
		}
		await runManager.cancel(req.params.id);
		res.json({ ok: true });
	} catch (err: any) {
		console.error('POST /api/runs/:id/cancel error', err);
		res.status(500).json({ error: 'Failed to cancel run' });
	}
});

export default router;
