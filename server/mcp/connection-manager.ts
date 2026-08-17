import { connectMcp, type McpClientHandle, type McpConnectionConfig } from './mcp-client.js';
import { logger } from '../utils/logger.js';

type ConnState =
	| { status: 'connecting'; promise: Promise<McpClientHandle> }
	| { status: 'connected'; handle: McpClientHandle }
	| { status: 'failed'; error: string };

const BACKOFF_MS = [1000, 2000, 4000];

export class ConnectionManager {
	private connections = new Map<string, ConnState>();
	private configs = new Map<string, McpConnectionConfig>();

	/** Registers a connection config without connecting. Call getConnection() to connect lazily. */
	configure(cfg: McpConnectionConfig): void {
		this.configs.set(cfg.id, cfg);
	}

	async getConnection(id: string): Promise<McpClientHandle | null> {
		const existing = this.connections.get(id);
		if (existing?.status === 'connected') return existing.handle;
		if (existing?.status === 'connecting') return existing.promise;
		if (existing?.status === 'failed') return null; // sticky — a broken config must not respawn forever

		const cfg = this.configs.get(id);
		if (!cfg) return null;

		const promise = this.connectWithRetry(cfg);
		this.connections.set(id, { status: 'connecting', promise });
		try {
			const handle = await promise;
			if (this.configs.get(id) !== cfg) {
				await handle.close();
				return null;
			}
			this.connections.set(id, { status: 'connected', handle });
			handle.onExit(() => {
				// Drop the cached handle so the next getConnection() call reconnects.
				this.connections.delete(id);
			});
			return handle;
		} catch (err: any) {
			this.connections.set(id, { status: 'failed', error: err?.message ?? String(err) });
			return null;
		}
	}

	private async connectWithRetry(cfg: McpConnectionConfig): Promise<McpClientHandle> {
		let lastErr: unknown;
		for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
			try {
				return await connectMcp(cfg);
			} catch (err) {
				lastErr = err;
				logger.warn('MCP', `[${cfg.id}] connect attempt ${attempt + 1} failed: ${(err as Error)?.message}`);
				if (attempt < BACKOFF_MS.length) {
					await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
				}
			}
		}
		throw lastErr;
	}

	status(id: string): 'connecting' | 'connected' | 'failed' | 'unconfigured' {
		return this.connections.get(id)?.status ?? 'unconfigured';
	}

	list(): string[] {
		return Array.from(this.configs.keys());
	}

	/** Revokes a server for the lifetime of this process and drops any resolved
	 *  credential held by its connection config. A restart may register it again
	 *  from operator-owned environment configuration. */
	async revoke(id: string): Promise<boolean> {
		const configured = this.configs.delete(id);
		const state = this.connections.get(id);
		this.connections.delete(id);
		try {
			if (state?.status === 'connected') await state.handle.close();
			if (state?.status === 'connecting') {
				const handle = await state.promise;
				await handle.close();
			}
		} catch (err: any) {
			logger.warn('MCP', `[${id}] revoke close error: ${err?.message}`);
		}
		return configured;
	}

	async closeAll(): Promise<void> {
		const closes = Array.from(this.connections.entries()).map(async ([id, state]) => {
			if (state.status === 'connected') {
				try {
					await state.handle.close();
				} catch (err: any) {
					logger.warn('MCP', `[${id}] close error: ${err?.message}`);
				}
			}
		});
		await Promise.all(closes);
		this.connections.clear();
	}
}

export const connectionManager = new ConnectionManager();
