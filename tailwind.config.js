/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	plugins: [],
	theme: {
		extend: {},
		screens: {
			'2xl': '1536px',
			'3xl': '1920px',
			lg: '1024px',
			md: '768px',
			sm: '640px',
			xl: '1280px'
		}
	}
};
