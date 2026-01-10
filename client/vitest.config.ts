import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

const isTest = !!process.env.VITEST;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: isTest
				? {
						// Force DOM compilation under Vitest so lifecycle hooks are available
						generate: 'dom',
						hydratable: true
					}
				: undefined
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom'
	}
});
