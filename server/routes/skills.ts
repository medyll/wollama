import express from 'express';
import SkillResolver from '../services/skill-resolver.service.js';
import { dbManager } from '../db/database.js';
import { getBuiltinHandler } from '../services/skills/index.js';

const router = express.Router();

// GET /api/skills?q=term
router.get('/', async (req, res) => {
    const q = (req.query.q as string) || '';
    const db = dbManager.getDb('skills');
    try {
        if (q) {
            // Simple text-match using multiple fields
            // NOTE: pouchdb-find supports basic selectors; this is a pragmatic approach
            const results = await db.find({
                selector: {
                    is_enabled: true,
                    $or: [
                        { name: { $regex: q } },
                        { display_name: { $regex: q } },
                        { description: { $regex: q } }
                    ]
                },
                limit: 50
            });
            res.json(results.docs);
            return;
        }

        const all = await db.find({ selector: { is_enabled: true }, limit: 200 });
        res.json(all.docs);
    } catch (error) {
        console.error('GET /api/skills error', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});

// POST /api/skills/:slug/invoke
router.post('/:slug/invoke', async (req, res) => {
    const slug = req.params.slug;
    try {
        const skill = await SkillResolver.findSkillBySlug(slug);
        if (!skill) {
            res.status(404).json({ error: 'Skill not found' });
            return;
        }

        const args = req.body.args || [];

        // Builtin handler
        if (skill.handler_type === 'builtin') {
            const handler = getBuiltinHandler(skill.handler_ref || skill.name || skill.skill_id);
            if (!handler) {
                res.status(500).json({ error: 'Builtin handler not found' });
                return;
            }
            try {
                const result = await handler(args, { skill, req });
                res.json({ skill_id: skill.skill_id, ...result });
                return;
            } catch (e) {
                console.error('Builtin handler error', e);
                res.status(500).json({ error: 'Handler execution failed' });
                return;
            }
        }

        // LLM handler stub
        if (skill.handler_type === 'llm') {
            // TODO: implement LLM-backed skill invocation (Ollama/OpenAI)
            res.status(501).json({ error: 'LLM handler not implemented' });
            return;
        }

        // Agent handler stub
        if (skill.handler_type === 'agent') {
            // TODO: enqueue or spawn agent invocation
            res.status(501).json({ error: 'Agent handler not implemented' });
            return;
        }

        res.status(400).json({ error: 'Unsupported handler type' });
    } catch (error) {
        console.error('POST /api/skills/:slug/invoke error', error);
        res.status(500).json({ error: 'Invocation failed' });
    }
});

export default router;
