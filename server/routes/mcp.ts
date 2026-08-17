import express from 'express';
import { connectionManager } from '../mcp/connection-manager.js';
import { toolCatalog } from '../orchestration/tool-catalog.js';
import { toolExecutor } from '../orchestration/tool-executor.js';
import { dbManager } from '../db/database.js';
import type { ExecutionContext } from '../orchestration/types.js';

const router = express.Router();

// GET /api/mcp/servers — connection status for every configured MCP server.
router.get('/servers', async (req, res) => {
	try {
		const ids = connectionManager.list();
		const servers = await Promise.all(
			ids.map(async (id) => {
				const status = connectionManager.status(id);
				let toolCount = 0;
				if (status === 'connected' || status === 'connecting') {
					try {
						const runtime = toolCatalog.runtimeFor(`mcp:${id}:_`);
						const tools = runtime ? await runtime.list({ origin: 'api' }) : [];
						toolCount = tools.length;
					} catch {
						// leave toolCount at 0 — a listing failure shouldn't fail the whole response
					}
				}
				return { id, status, toolCount };
			})
		);
		res.json(servers);
	} catch (err: any) {
		console.error('GET /api/mcp/servers error', err);
		res.status(500).json({ error: 'Failed to list MCP servers' });
	}
});

// GET /api/mcp/tools — every tool from every registered runtime (builtin + MCP).
router.get('/tools', async (req, res) => {
	try {
		const ctx: ExecutionContext = { origin: 'api' };
		const tools = await toolCatalog.list(ctx);
		res.json(tools);
	} catch (err: any) {
		console.error('GET /api/mcp/tools error', err);
		res.status(500).json({ error: 'Failed to list tools' });
	}
});

// POST /api/mcp/tools/:toolId/call — manual verification / non-chat callers.
// toolId is namespaced and may contain ':' (e.g. mcp:acp-team:agent_list) — accept the
// remainder of the path rather than a single param segment. Express 5 (path-to-regexp v8)
// requires a named wildcard.
router.post('/tools/*splat', async (req, res) => {
	const splat = (req.params as any).splat;
	const toolId = Array.isArray(splat) ? splat.join('/') : splat;
	if (!toolId) {
		res.status(400).json({ error: 'toolId is required' });
		return;
	}
	const input = req.body?.input ?? {};
	try {
		const ctx: ExecutionContext = {
			origin: 'api',
			workspace: typeof req.body?.workspace === 'string' ? req.body.workspace : undefined
		};
		const result = await toolExecutor.executeById(toolId, input, ctx);
		res.json(result);
	} catch (err: any) {
		console.error('POST /api/mcp/tools/:toolId/call error', err);
		res.status(500).json({ error: 'Tool call failed' });
	}
});

// GET /api/mcp/tool-calls/:id — full persisted tool_calls row, for UI display
// (ToolCallCard.svelte). GET /api/agents/:id/status returns a narrower shape kept
// as-is for its existing callers.
router.get('/tool-calls/:id', async (req, res) => {
	try {
		const db = dbManager.getDb('tool_calls');
		const doc = await db.get(req.params.id);
		res.json(doc);
	} catch (err: any) {
		if (err.status === 404) {
			res.status(404).json({ error: 'tool_call not found' });
			return;
		}
		console.error('GET /api/mcp/tool-calls/:id error', err);
		res.status(500).json({ error: 'Failed to fetch tool call' });
	}
});

export default router;
