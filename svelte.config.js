import path from 'path';
import { mdsvex } from 'mdsvex';

// Tauri doesn't have a Node.js server to do proper SSR
// so we will use adapter-static to prerender the app (SSG)
// See: https://v2.tauri.app/start/frontend/sveltekit/ for more info
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex()],
	kit:        {
		adapter: adapter(),
		alias:   {
			$components:    path.resolve('./src/components'),
			$types:         path.resolve('./src/types'),
			$configuration: path.resolve('./src/configuration')
		}
	},
	extensions: ['.svelte']
};

export default config;
