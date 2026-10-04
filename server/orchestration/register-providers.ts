import { providerRegistry } from './provider-registry.js';
import { ollamaProvider } from './ollama.provider.js';
import { createCliProvider } from './cli.provider.js';

/**
 * Seeds the provider registry at boot.
 *
 * Ollama remains the primary provider. Installed CLI adapters are probed when the
 * catalogue is requested, so a missing binary never prevents server startup.
 */
export function registerProviders(): void {
	providerRegistry.register(ollamaProvider, { asDefault: true });
	for (const type of ['codex', 'claude', 'kimi'] as const) providerRegistry.register(createCliProvider(type));
}
