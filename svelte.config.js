import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
// import @medyll/htmlu
//import { htmluSveltePreprocess } from '@medyll/htmlu';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$components: './src/components',
			$configuration: './src/configuration',
			$types: './src/types'
		}
	},

	preprocess: [vitePreprocess()] // htmluSveltePreprocess(),
};
export default config;
