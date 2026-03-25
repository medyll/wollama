import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// Force DOM compilation under Vitest so lifecycle hooks are available
			compilerOptions: {
				generate: 'dom',
				hydratable: true
			}
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		environmentOptions: {
			jsdom: {
				// Ensure localStorage/sessionStorage are available
				url: 'http://localhost/'
			}
		},
		coverage: {
			provider: 'v8',
			include: ['src/lib/auth.ts', 'src/lib/state/user.svelte.ts'],
			thresholds: {
				lines: 85,
				functions: 85,
				branches: 85,
				statements: 85
			}
		}
	}
});
