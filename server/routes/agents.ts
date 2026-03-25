import express from 'express';
import { AgentRunnerService } from '../services/agent-runner.service.js';

const router = express.Router();

// POST /api/agents/run — invoke an agent by slug
router.post('/run', async (req, res) => {
    const { slug, input, message_id, agent_id } = req.body;
    if (!slug || typeof slug !== 'string') {
        res.status(400).json({ error: 'slug is required' });
        return;
    }
    if (!input || typeof input !== 'object') {
        res.status(400).json({ error: 'input must be an object' });
        return;
    }
    try {
        const result = await AgentRunnerService.run({ slug, input, message_id, agent_id });
        if (result.status === 'error' && !result.tool_call_id) {
            res.status(404).json({ error: result.error });
            return;
        }
        res.json(result);
    } catch (err: any) {
        console.error('POST /api/agents/run error', err);
        res.status(500).json({ error: 'Agent invocation failed' });
    }
});

// GET /api/agents/:tool_call_id/status
router.get('/:tool_call_id/status', async (req, res) => {
    const { tool_call_id } = req.params;
    try {
        const record = await AgentRunnerService.getStatus(tool_call_id);
        if (!record) {
            res.status(404).json({ error: 'tool_call not found' });
            return;
        }
        res.json({ status: record.status, output: record.output, error: record.error });
    } catch (err: any) {
        console.error('GET /api/agents/:id/status error', err);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
