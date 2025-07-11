import globalConfigs from 'globals';
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
	'@typescript-eslint/consistent-type-imports': [
		'error',
		{
			disallowTypeAnnotations: false,
		},
	],
};

const globals = {
	...globalConfigs.jest,
	...globalConfigs.browser,
	...globalConfigs.node,
	googletag: 'readonly',
};

/** @type { import("eslint").Linter.Config[] } */
export default [
	{
		ignores: [
			'**/*.js',
			'**/*.mjs',
			'**/dist',
			'**/playwright',
			'bundle/playwright.config.ts',
		],
	},
	...guardian.configs.recommended,
	...guardian.configs.jest,
	{},
	{
		files: ['bundle/src/**/*.ts'],
		ignores: ['core/src/**/*.ts'],
		languageOptions: {
			globals,
		},
		rules,
		settings: {
			'import-x/resolver': {
				typescript: {
					project: ['bundle/tsconfig.json'],
					conditionNames: ['workspace'],
				},
			},
		},
	},
	{
		files: ['core/src/**/*.ts'],
		ignores: ['bundle/src/**/*.ts'],
		languageOptions: {
			globals,
		},
		rules: {
			...rules,
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
		},
		settings: {
			'import-x/resolver': {
				typescript: {
					project: ['core/tsconfig.json'],
					conditionNames: ['workspace'],
				},
			},
		},
	},
	{
		files: ['**/*.spec.ts'],
		rules: {
			'@typescript-eslint/unbound-method': 'off',
		},
	},
];
