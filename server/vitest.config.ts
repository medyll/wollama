import { defineConfig } from 'vitest/config';
import os from 'os';
import path from 'path';

export default defineConfig({
	test: {
		include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		environment: 'node',
		env: {
			DB_PATH: path.join(os.tmpdir(), 'wollama-test-db')
		}
	}
});
