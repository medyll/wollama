import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			$components: path.resolve('./src/components'),
			$types: path.resolve('./src/types'),
			$configuration: path.resolve('./src/configuration')
		}
	},
	extensions: ['.svelte']
};

export default config;
