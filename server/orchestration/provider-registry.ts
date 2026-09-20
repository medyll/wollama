import { DEFAULT_PROVIDER_ID } from '../../shared/types/provider.js';
import type { ProviderModel, ProviderSummary } from '../../shared/types/provider.js';
import type { LlmProvider } from './types.js';

/**
 * Resolves a provider id to the adapter that serves it.
 *
 * Kept deliberately dumb: registration is explicit (see register-providers.ts), so
 * nothing here reaches into config or spawns clients at import time — that keeps the
 * registry unit-testable and lets P1 swap the seeded set for user-created instances
 * without touching call sites.
 */
export class ProviderRegistry {
	private providers = new Map<string, LlmProvider>();
	private defaultId = DEFAULT_PROVIDER_ID;

	register(provider: LlmProvider, options: { asDefault?: boolean } = {}): void {
		this.providers.set(provider.id, provider);
		if (options.asDefault || this.providers.size === 1) {
			this.defaultId = provider.id;
		}
	}

	unregister(id: string): void {
		this.providers.delete(id);
	}

	clear(): void {
		this.providers.clear();
		this.defaultId = DEFAULT_PROVIDER_ID;
	}

	has(id: string): boolean {
		return this.providers.has(id);
	}

	list(): LlmProvider[] {
		return [...this.providers.values()];
	}

	getDefaultId(): string {
		return this.defaultId;
	}

	/**
	 * An unknown id is an error, never a silent fallback to the default: routing a
	 * chat to a different backend than the one the caller asked for would bill the
	 * wrong account and leak the conversation to an unintended provider.
	 */
	get(id?: string): LlmProvider {
		const resolved = id ?? this.defaultId;
		const provider = this.providers.get(resolved);
		if (!provider) {
			const known = [...this.providers.keys()].join(', ') || 'none';
			const err: Error & { status_code?: number } = new Error(`Unknown provider '${resolved}'. Registered: ${known}`);
			err.status_code = 404;
			throw err;
		}
		return provider;
	}

	/** Providers reachable right now. Probes run in parallel; a provider whose probe
	 *  rejects is reported unavailable rather than failing the whole call. */
	async listAvailable(): Promise<LlmProvider[]> {
		const checked = await Promise.all(this.list().map(async (p) => ({ p, ok: await p.isAvailable().catch(() => false) })));
		return checked.filter((c) => c.ok).map((c) => c.p);
	}

	/** Redacted view for GET /api/providers — no key material ever crosses this line. */
	async summaries(): Promise<ProviderSummary[]> {
		return Promise.all(
			this.list().map(async (p) => ({
				id: p.id,
				type: p.type,
				label: p.label,
				family: p.family,
				enabled: true,
				available: await p.isAvailable().catch(() => false),
				capabilities: p.capabilities,
				// P0 has no secret store yet; a provider that needs a key and has one
				// registered is by definition configured, so this mirrors capabilities.
				hasApiKey: p.capabilities.requiresApiKey
			}))
		);
	}

	/** Models across every reachable provider. One provider failing to list does not
	 *  empty the picker for the others. */
	async listModels(providerId?: string): Promise<ProviderModel[]> {
		const targets = providerId ? [this.get(providerId)] : await this.listAvailable();
		const results = await Promise.all(targets.map((p) => p.listModels().catch(() => [] as ProviderModel[])));
		return results.flat();
	}
}

/** The process-wide registry. Populated by register-providers.ts at startup. */
export const providerRegistry = new ProviderRegistry();
