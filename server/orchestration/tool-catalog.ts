import type { ExecutionContext, ToolDescriptor, ToolRuntime } from './types.js';

/**
 * Sanitizes a (serverId, name) pair into a wire-safe function name for the model.
 * Many instruct-tuned models were trained against `^[a-zA-Z0-9_-]{1,64}$` and mangle
 * anything outside it, so tool ids like `mcp:acp-team:agent_start` (which contain `:`)
 * never go to the model directly — only the wire name does.
 */
export function toWireName(serverId: string, name: string): string {
	const raw = `mcp__${serverId}__${name}`;
	return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
}

class ToolCatalog {
	private runtimes = new Map<string, ToolRuntime>();

	register(runtime: ToolRuntime): void {
		this.runtimes.set(runtime.serverId, runtime);
	}

	unregister(serverId: string): void {
		this.runtimes.delete(serverId);
	}

	async list(ctx: ExecutionContext): Promise<ToolDescriptor[]> {
		const lists = await Promise.all(Array.from(this.runtimes.values()).map((r) => r.list(ctx)));
		const seen = new Map<string, ToolDescriptor>();
		for (const descriptors of lists) {
			for (const d of descriptors) {
				seen.set(d.id, d);
			}
		}
		return Array.from(seen.values());
	}

	/** Resolves a wire name back to its descriptor. O(n) over registered runtimes' last list() — callers should cache the list() result for a turn. */
	async resolveWireName(wireName: string, ctx: ExecutionContext): Promise<ToolDescriptor | undefined> {
		const all = await this.list(ctx);
		return all.find((d) => d.wireName === wireName);
	}

	async get(toolId: string, ctx: ExecutionContext): Promise<ToolDescriptor | undefined> {
		const all = await this.list(ctx);
		return all.find((d) => d.id === toolId);
	}

	runtimeFor(toolId: string): ToolRuntime | undefined {
		const serverId = toolId.split(':')[0] === 'mcp' ? toolId.split(':')[1] : toolId.split(':')[0];
		return this.runtimes.get(serverId);
	}
}

export const toolCatalog = new ToolCatalog();
