import globals from 'globals';
import guardian from '@guardian/eslint-config';

const rules = {
	'id-denylist': ['error'],
	'@typescript-eslint/no-unsafe-argument': 'off',
	'@typescript-eslint/no-unsafe-return': 'off',
	'@typescript-eslint/unbound-method': 'off',
	curly: ['error', 'multi-line'],
	'no-use-before-define': [
		'error',
		{
			functions: true,
			classes: true,
		},
	],
	'import/exports-last': 'error',
	'no-else-return': 'error',
	'no-restricted-imports': [
		'error',
		{
			patterns: [
				{
					group: [
						'define/*',
						'display/*',
						'events/*',
						'experiments/*',
						'init/*',
						'lib/*',
						'insert/*',
						'types/*',
					],
					message:
						'Non-relative imports from src are forbidden. Please use a relative path instead',
				},
			],
		},
	],
};

const globals = {
	...globals.jest,
	...globals.browser,
	...globals.node,
	googletag: 'readonly',
};

/** @type { import("eslint").Linter.Config[] } */
export default [
	{
		ignores: [
			'**/*.js',
			'**/*.mjs',
			'**/dist',
			'playwright/**',
			'src/lib/__mocks__/ad-sizes.ts',
		],
	},
	...guardian.configs.recommended,
	...guardian.configs.jest,
	{
		settings: {
			'import-x/resolver': {
				typescript: {
					project: ['./tsconfig.json'],
					conditionNames: [
						'development',
						'import',
						'require',
						'default',
					],
				},
			},
		},
	},
	{
		files: ['src/**/*.ts'],
		ignores: ['core/src/**/*.ts'],
		languageOptions: {
			globals,
		},
		rules,
	},
	{
		files: ['core/src/**/*.ts'],
		ignores: ['src/**/*.ts'],
		languageOptions: {
			globals,
		},
		rules,
	},
	{
		files: ['**/*.spec.ts'],
		rules: {
			'@typescript-eslint/unbound-method': 'off',
		},
	},
];
