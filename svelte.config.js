import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'; 

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter(),
        alias: {
            $components: './src/components',
            $configuration: './src/configuration',
            $types: './src/types',
        },
    },
    extensions: ['.svelte'],
    preprocess: [vitePreprocess()],  
};
export default config;
