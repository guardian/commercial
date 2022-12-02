module.exports = {
	plugins: ['guardian-frontend', 'prettier'],
			extends: '@guardian/eslint-config-typescript',
			parserOptions: {
				project: './tsconfig.json',
			},
			rules: {
				'import/no-unresolved': 0,
				'no-restricted-imports': [
					'error',
					{
						name: 'bonzo',
						message: 'Use `lib/$$` instead.',
					},
					{
						name: 'qwery',
						message: 'Use `lib/$$` instead.',
					},
					{
						name: 'bean',
						message: 'Use `lib/$$` instead.',
					},
				],
			},
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
	ignorePatterns: ['*.js']
};
