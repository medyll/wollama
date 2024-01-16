import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';
// import @medyll/htmlu
import { htmluSveltePreprocess } from '@medyll/htmlu';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({ out: 'build' }),
		alias: {
			$components: './src/components',
			$configuration: './src/configuration',
			$types: './src/types'
		}
	},

	preprocess: [vitePreprocess()] // htmluSveltePreprocess(),
};
export default config;
