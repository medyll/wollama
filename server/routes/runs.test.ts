import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const { mockListByChat } = vi.hoisted(() => ({ mockListByChat: vi.fn() }));

vi.mock('../orchestration/run-manager.js', () => ({
	runManager: {
		listByChat: mockListByChat,
		get: vi.fn(),
		events: vi.fn(),
		cancel: vi.fn()
	}
}));

import runsRouter from './runs.js';

const app = express();
app.use('/api/runs', runsRouter);

let server: ReturnType<typeof app.listen>;
let baseUrl = '';

describe('Run routes', () => {
	beforeAll(() => {
		server = app.listen(0);
		const address = server.address();
		const port = typeof address === 'string' || address === null ? 0 : address.port;
		baseUrl = `http://127.0.0.1:${port}`;
	});

	afterAll(() => {
		server.close();
	});

	it('GET /api/runs lists persisted runs for a chat', async () => {
		mockListByChat.mockResolvedValueOnce([{ run_id: 'run-1', chat_id: 'chat-1' }]);

		const response = await fetch(`${baseUrl}/api/runs?chat_id=chat-1`);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([{ run_id: 'run-1', chat_id: 'chat-1' }]);
		expect(mockListByChat).toHaveBeenCalledWith('chat-1');
	});

	it('requires chat_id', async () => {
		const response = await fetch(`${baseUrl}/api/runs`);

		expect(response.status).toBe(400);
	});
});
