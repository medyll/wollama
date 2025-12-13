import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		environment: 'node'
	}
});
