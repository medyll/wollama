import { dbManager } from '../db/database.js';
import { logger } from '../utils/logger.js';
import type { Hook, HookEvent } from '../../shared/types/hooks.js';

/**
 * Loads hooks from PouchDB at startup and caches them in memory,
 * indexed by event for O(1) lookup during the pipeline.
 */
class HookRegistry {
	private cache = new Map<HookEvent, Hook[]>();
	private initialized = false;

	async load(): Promise<void> {
		try {
			const db = dbManager.getDb('hooks');
			const result = await db.find({ selector: { is_enabled: true } });
			const hooks: Hook[] = result.docs as Hook[];

			this.cache.clear();
			for (const hook of hooks) {
				const list = this.cache.get(hook.event) ?? [];
				list.push(hook);
				this.cache.set(hook.event, list);
			}

			// Sort each event list by priority (ascending — lower runs first)
			for (const [event, list] of this.cache.entries()) {
				this.cache.set(
					event,
					list.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))
				);
			}

			this.initialized = true;
			logger.info('HOOKS', `Registry loaded — ${hooks.length} hook(s) across ${this.cache.size} event(s)`);
		} catch (err) {
			// hooks table may not exist yet during first boot
			logger.warn('HOOKS', 'Could not load hook registry (table may be empty)');
			this.initialized = true;
		}
	}

	getForEvent(event: HookEvent): Hook[] {
		if (!this.initialized) return [];
		return this.cache.get(event) ?? [];
	}

	/** Call after creating/updating/deleting hooks to refresh the cache */
	async reload(): Promise<void> {
		await this.load();
	}
}

export const hookRegistry = new HookRegistry();
