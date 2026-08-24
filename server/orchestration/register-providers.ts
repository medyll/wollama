import { providerRegistry } from './provider-registry.js';
import { ollamaProvider } from './ollama.provider.js';

/**
 * Seeds the provider registry at boot.
 *
 * P0 registers the single built-in ollama instance, so behaviour is identical to the
 * hard-wired setup it replaces. Additional adapters (anthropic, openai-compatible,
 * codex, opencode) and user-created instances register here once their config store
 * lands — see ARCH-PROVIDERS.md §9.
 */
export function registerProviders(): void {
	providerRegistry.register(ollamaProvider, { asDefault: true });
}
