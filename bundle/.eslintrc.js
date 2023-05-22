module.exports = {
	root: true,
	plugins: ['@typescript-eslint', 'import'],
	extends: [
		'@guardian/eslint-config-typescript',
		'plugin:import/recommended',
	],
	rules: {
		'id-denylist': ['error'],
		// TODO - remove these rule once we've migrated to commercial-core
		'@typescript-eslint/no-unsafe-argument': 'off',
		'@typescript-eslint/no-unsafe-return': 'off',
		'@typescript-eslint/unbound-method': 'off',
	},
	overrides: [
		{
			files: ['*.spec.ts'],
			rules: {
				// This rule erroneously flags up instances where you expect(obj.fn).toHaveBeenCalled
				// Enabled for test files only
				'@typescript-eslint/unbound-method': 'off',
			},
		},
	],
	ignorePatterns: ['*.js', 'dist', 'src/__vendor', '.eslintrc.js'],
	settings: {
		'import/resolver': {
			alias: {
				map: [['svgs', './static/svg']],
			},
		},
	},
	env: {
		jest: true,
		browser: true,
		node: true,
	},
	globals: { googletag: 'readonly' },
};
