module.exports = {
	root: true,
	plugins: ['@typescript-eslint', 'import'],
	extends: [
		'@guardian/eslint-config-typescript',
		'plugin:import/recommended',
	],
	rules: {
		// disallow naming variables 'guardian', because
		// window.guardian is our global config/settings object
		'id-denylist': ['error', 'guardian'],
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
	ignorePatterns: ['*.js'],
};
