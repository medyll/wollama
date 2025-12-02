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
		adapter: adapter({
			fallback: 'index.html'
		}),
		files: {
			assets: 'client/static',
			lib: 'client/src/lib',
			routes: 'client/src/routes',
			appTemplate: 'client/src/app.html'
		},
		alias:   {
			$components:    path.resolve('./client/src/components'),
			$types:         path.resolve('./client/src/types'),
			$configuration: path.resolve('./client/src/configuration')
		}
	},
	extensions: ['.svelte']
};

export default config;
