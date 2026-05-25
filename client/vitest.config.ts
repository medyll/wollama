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
	resolve: {
		conditions: ['browser']
	},
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
			include: [
				'src/lib/**/*.{ts,svelte}',
				'src/components/**/*.{ts,svelte}'
			],
			exclude: [
				'src/lib/**/*.test.ts',
				'src/lib/index.ts'
			],
			thresholds: {
				lines: 60,
				functions: 60,
				branches: 60,
				statements: 60
			}
		}
	}
});
