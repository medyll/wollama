import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRegistry } from './provider-registry.js';
import { NO_CAPABILITIES } from '../../shared/types/provider.js';
import type { ProviderModel } from '../../shared/types/provider.js';
import type { LlmProvider } from './types.js';

function makeProvider(id: string, over: Partial<LlmProvider> = {}): LlmProvider {
	return {
		id,
		type: 'ollama',
		family: 'http',
		label: id,
		capabilities: { ...NO_CAPABILITIES, streaming: true },
		isAvailable: async () => true,
		listModels: async (): Promise<ProviderModel[]> => [{ id: `${id}-model`, label: `${id}-model`, providerId: id }],
		chat: async () => ({ stream: (async function* () {})() }),
		buildToolMessages: () => [],
		...over
	};
}

describe('ProviderRegistry', () => {
	let registry: ProviderRegistry;

	beforeEach(() => {
		registry = new ProviderRegistry();
	});

	it('resolves a registered provider by id', () => {
		const p = makeProvider('ollama');
		registry.register(p);
		expect(registry.get('ollama')).toBe(p);
	});

	it('uses the first registered provider as the default', () => {
		const first = makeProvider('ollama');
		registry.register(first);
		registry.register(makeProvider('anthropic'));
		expect(registry.getDefaultId()).toBe('ollama');
		expect(registry.get()).toBe(first);
	});

	it('honours an explicit default', () => {
		registry.register(makeProvider('ollama'));
		const anthropic = makeProvider('anthropic');
		registry.register(anthropic, { asDefault: true });
		expect(registry.get()).toBe(anthropic);
	});

	it('throws a 404-shaped error on an unknown id instead of falling back', () => {
		registry.register(makeProvider('ollama'));
		let caught: any;
		try {
			registry.get('nope');
		} catch (e) {
			caught = e;
		}
		expect(caught).toBeInstanceOf(Error);
		expect(caught.status_code).toBe(404);
		expect(caught.message).toContain('nope');
	});

	it('reports a provider whose probe rejects as unavailable', async () => {
		registry.register(makeProvider('ollama'));
		registry.register(
			makeProvider('down', {
				isAvailable: async () => {
					throw new Error('ECONNREFUSED');
				}
			})
		);
		const available = await registry.listAvailable();
		expect(available.map((p) => p.id)).toEqual(['ollama']);
	});

	it('aggregates models across available providers', async () => {
		registry.register(makeProvider('ollama'));
		registry.register(makeProvider('anthropic'));
		const models = await registry.listModels();
		expect(models.map((m) => m.id)).toEqual(['ollama-model', 'anthropic-model']);
	});

	it('scopes model listing to one provider when asked', async () => {
		registry.register(makeProvider('ollama'));
		registry.register(makeProvider('anthropic'));
		const models = await registry.listModels('anthropic');
		expect(models.map((m) => m.providerId)).toEqual(['anthropic']);
	});

	it('keeps one failing listModels from emptying the picker', async () => {
		registry.register(makeProvider('ollama'));
		registry.register(
			makeProvider('broken', {
				listModels: async () => {
					throw new Error('boom');
				}
			})
		);
		const models = await registry.listModels();
		expect(models.map((m) => m.id)).toEqual(['ollama-model']);
	});

	it('summaries never expose key material', async () => {
		registry.register(
			makeProvider('anthropic', {
				capabilities: { ...NO_CAPABILITIES, requiresApiKey: true }
			})
		);
		const [summary] = await registry.summaries();
		// Only the boolean crosses the line: no field carries the key itself.
		expect(summary.hasApiKey).toBe(true);
		expect(Object.keys(summary)).not.toContain('apiKey');
		expect(JSON.stringify(summary)).not.toMatch(/sk-|secret/i);
	});

	it('does not probe availability more than once per summary', async () => {
		const isAvailable = vi.fn().mockResolvedValue(true);
		registry.register(makeProvider('ollama', { isAvailable }));
		await registry.summaries();
		expect(isAvailable).toHaveBeenCalledTimes(1);
	});
});
