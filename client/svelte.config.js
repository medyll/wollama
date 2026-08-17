import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import path from 'path';
import { fileURLToPath } from 'url';

const clientDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			$components: path.join(clientDirectory, 'src/components'),
			$types: path.join(clientDirectory, 'src/types'),
			$configuration: path.join(clientDirectory, 'src/configuration')
		}
	},
	extensions: ['.svelte']
};

export default config;
