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
		files: {
			assets: 'client/static',
			hooks: 'client/src/hooks',
			lib: 'client/src/lib',
			params: 'client/src/params',
			routes: 'client/src/routes',
			serviceWorker: 'client/src/service-worker',
			appTemplate: 'client/src/app.html',
			errorTemplate: 'client/src/error.html'
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
