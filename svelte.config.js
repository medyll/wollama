import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			assets: 'build',
			fallback: '200.html',
			pages: 'build'
		}),
		alias: {
			$components: './src/components',
			$configuration: './src/configuration',
			$types: './src/types'
		}
	},

	preprocess: vitePreprocess()
};

export default config;
