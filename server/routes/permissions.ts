import express from 'express';
import { permissionService } from '../orchestration/permission-service.js';
import { toolCatalog } from '../orchestration/tool-catalog.js';
import type { ExecutionContext } from '../orchestration/types.js';

const router = express.Router();

// POST /api/permissions/:requestId — resolve a pending permission_request.
// Body: { decision: 'allow'|'deny', scope: 'once'|'session'|'persistent',
//         user_id?: string, workspace?: string, tool_id?: string,
//         authorization?: string  // only meaningful for acp-team write/execute tools
//       }
// The acp-team authorization token, if present, is held in-memory only (see
// permission-service.ts) — never written to a request log or persisted.
router.post('/:requestId', async (req, res) => {
	const { requestId } = req.params;
	const { decision, scope, user_id, workspace, tool_id, authorization } = req.body ?? {};

	if (decision !== 'allow' && decision !== 'deny') {
		res.status(400).json({ error: "decision must be 'allow' or 'deny'" });
		return;
	}
	if (!['once', 'session', 'persistent'].includes(scope)) {
		res.status(400).json({ error: "scope must be 'once', 'session', or 'persistent'" });
		return;
	}

	try {
		const ctx: ExecutionContext = { origin: 'api', user_id, workspace };
		const descriptor = scope === 'persistent' && tool_id ? await toolCatalog.get(tool_id, ctx) : undefined;

		const ok = await permissionService.resolve(requestId, decision, scope, {
			ctx,
			descriptor,
			authorization: typeof authorization === 'string' ? authorization : undefined
		});

		if (!ok) {
			res.status(404).json({ error: 'permission request not found (already resolved, timed out, or unknown)' });
			return;
		}
		res.json({ ok: true });
	} catch (err: any) {
		console.error('POST /api/permissions/:requestId error', err);
		res.status(500).json({ error: 'Failed to resolve permission request' });
	}
});

// POST /api/permissions/grants/:grantId/revoke
router.post('/grants/:grantId/revoke', async (req, res) => {
	try {
		const ok = await permissionService.revoke(req.params.grantId);
		if (!ok) {
			res.status(404).json({ error: 'grant not found' });
			return;
		}
		res.json({ ok: true });
	} catch (err: any) {
		console.error('POST /api/permissions/grants/:grantId/revoke error', err);
		res.status(500).json({ error: 'Failed to revoke grant' });
	}
});

export default router;
