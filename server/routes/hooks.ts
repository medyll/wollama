import express from 'express';
import { dbManager } from '../db/database.js';
import { hookRegistry } from '../services/hook-registry.service.js';

const router = express.Router();

// GET /api/hooks
router.get('/', async (_req, res) => {
    const db = dbManager.getDb('hooks');
    try {
        const result = await db.find({ selector: {}, limit: 200 });
        res.json(result.docs);
    } catch (error) {
        console.error('GET /api/hooks error', error);
        res.status(500).json({ error: 'Failed to fetch hooks' });
    }
});

// PATCH /api/hooks/:id
router.patch('/:id', async (req, res) => {
    const db = dbManager.getDb('hooks');
    const { id } = req.params;
    const { is_enabled } = req.body;

    if (typeof is_enabled !== 'boolean') {
        res.status(400).json({ error: 'is_enabled (boolean) is required' });
        return;
    }

    try {
        const doc = await db.get(id);
        const updated = await db.put({ ...doc, is_enabled });
        await hookRegistry.reload();
        res.json({ id, is_enabled, rev: updated.rev });
    } catch (error: any) {
        if (error.status === 404) {
            res.status(404).json({ error: 'Hook not found' });
        } else {
            console.error('PATCH /api/hooks/:id error', error);
            res.status(500).json({ error: 'Failed to update hook' });
        }
    }
});

export default router;
