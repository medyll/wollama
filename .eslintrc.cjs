/** @type { import("eslint").Linter.FlatConfig } */
module.exports = {
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:svelte/recommended', 'prettier'],
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte', '.cjs']
	},
	plugins: ['@typescript-eslint', 'sort-keys-fix', 'align-assignments'],
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	],
	rules: {
		'object-shorthand': 'on',
		/* 'sort-keys': ['error', 'asc', { caseSensitive: false, natural: true }], */
		'sort-keys-fix/sort-keys-fix': 'error',
		'align-assignments/align-assignments': ['error', { requiresOnly: false }]
	}
};
