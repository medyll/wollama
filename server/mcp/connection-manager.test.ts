import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { McpClientHandle, McpConnectionConfig } from './mcp-client.js';

const { mockConnectMcp } = vi.hoisted(() => ({ mockConnectMcp: vi.fn() }));

vi.mock('./mcp-client.js', () => ({
	connectMcp: mockConnectMcp
}));

import { ConnectionManager } from './connection-manager.js';

function httpConfig(): McpConnectionConfig {
	return { id: 'remote', transport: 'http', url: 'https://mcp.example.test' };
}

function handle(id: string): McpClientHandle & { exit(): void; close: ReturnType<typeof vi.fn> } {
	let onExit: ((code: number | null) => void) | undefined;
	return {
		id,
		listTools: vi.fn(),
		callTool: vi.fn(),
		close: vi.fn(async () => undefined),
		onExit(cb) {
			onExit = cb;
		},
		exit() {
			onExit?.(null);
		}
	};
}

describe('ConnectionManager HTTP lifecycle', () => {
	beforeEach(() => {
		mockConnectMcp.mockReset();
	});

	it('reconnects lazily after the active transport closes', async () => {
		const first = handle('remote');
		const second = handle('remote');
		mockConnectMcp.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
		const manager = new ConnectionManager();
		manager.configure(httpConfig());

		expect(await manager.getConnection('remote')).toBe(first);
		first.exit();
		expect(await manager.getConnection('remote')).toBe(second);
		expect(mockConnectMcp).toHaveBeenCalledTimes(2);
	});

	it('revokes the configuration, closes the active transport, and prevents reconnect', async () => {
		const active = handle('remote');
		mockConnectMcp.mockResolvedValue(active);
		const manager = new ConnectionManager();
		manager.configure(httpConfig());
		await manager.getConnection('remote');

		expect(await manager.revoke('remote')).toBe(true);
		expect(active.close).toHaveBeenCalledOnce();
		expect(manager.status('remote')).toBe('unconfigured');
		expect(await manager.getConnection('remote')).toBeNull();
		expect(mockConnectMcp).toHaveBeenCalledOnce();
	});
});
