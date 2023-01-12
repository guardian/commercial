module.exports = {
	root: true,
	extends: [
		'@guardian/eslint-config-typescript',
		'plugin:import/recommended',
	],
	parserOptions: {
		project: ['./tsconfig.json'],
		tsconfigRootDir: __dirname,
	},
	env: {
		jest: true,
		browser: true,
		node: true,
	},
	globals: { googletag: 'readonly' },
	ignorePatterns: ['dist', 'coverage', 'src/__vendor', '.eslintrc.js'],
	rules: {
		curly: ['error', 'multi-line'],
		'no-use-before-define': ['error', { functions: true, classes: true }],
		'import/exports-last': 'error',
	},
};
