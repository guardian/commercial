import globals from "globals";
import guardian from '@guardian/eslint-config';


export default [
	{
		ignores: [
			'**/*.js',
			'**/*.mjs',
			'**/dist',
			'src/__vendor',
			'src/lib/__mocks__/ad-sizes.ts',
		],
	},
	...guardian.configs.recommended,
	...guardian.configs.jest,
	{
		    languageOptions: {
		        globals: {
		            ...globals.jest,
		            ...globals.browser,
		            ...globals.node,
		            googletag: "readonly",
		        },

		        ecmaVersion: 5,
		        sourceType: "commonjs",

		        parserOptions: {
		            project: ["./tsconfig.json"],
		            tsconfigRootDir: "./",
		        },
		    },

		    settings: {
		        "import/resolver": {
		            alias: {
		                map: [["svgs", "./static/svg"]],
		            },
		        },
		    },

		    rules: {
		        "id-denylist": ["error"],
		        "@typescript-eslint/no-unsafe-argument": "off",
		        "@typescript-eslint/no-unsafe-return": "off",
		        "@typescript-eslint/unbound-method": "off",
		        curly: ["error", "multi-line"],

		        "no-use-before-define": ["error", {
		            functions: true,
		            classes: true,
		        }],

		        "import/exports-last": "error",
		        "no-else-return": "error",

		        "no-restricted-imports": ["error", {
		            patterns: [{
		                group: [
		                    "define/*",
		                    "display/*",
		                    "events/*",
		                    "experiments/*",
		                    "init/*",
		                    "lib/*",
		                    "insert/*",
		                    "types/*",
		                ],

		                message: "Non-relative imports from src are forbidden. Please use a relative path instead",
		            }],
		        }],
		    },
		}, {
		    files: ["**/*.spec.ts"],

		    rules: {
		        "@typescript-eslint/unbound-method": "off",
		    },
		}
];


// export default [{
//     ignores: [
// 		"**/node_modules/",
//         "**/*.js",
//         "**/dist",
//         "src/__vendor",
//         "**/.eslintrc.js",
//         "src/lib/__mocks__/ad-sizes.ts",

//     ],
// }, ...fixupConfigRules(
//     compat.extends("@guardian/eslint-config"),
// ), {
//     plugins: {
//         "@typescript-eslint": typescriptEslint,
//         import: fixupPluginRules(_import),
//     },

//     languageOptions: {
//         globals: {
//             ...globals.jest,
//             ...globals.browser,
//             ...globals.node,
//             googletag: "readonly",
//         },

//         ecmaVersion: 5,
//         sourceType: "commonjs",

//         parserOptions: {
//             project: ["./tsconfig.json"],
//             tsconfigRootDir: "./",
//         },
//     },

//     settings: {
//         "import/resolver": {
//             alias: {
//                 map: [["svgs", "./static/svg"]],
//             },
//         },
//     },

//     rules: {
//         "id-denylist": ["error"],
//         "@typescript-eslint/no-unsafe-argument": "off",
//         "@typescript-eslint/no-unsafe-return": "off",
//         "@typescript-eslint/unbound-method": "off",
//         curly: ["error", "multi-line"],

//         "no-use-before-define": ["error", {
//             functions: true,
//             classes: true,
//         }],

//         "import/exports-last": "error",
//         "no-else-return": "error",

//         "no-restricted-imports": ["error", {
//             patterns: [{
//                 group: [
//                     "define/*",
//                     "display/*",
//                     "events/*",
//                     "experiments/*",
//                     "init/*",
//                     "lib/*",
//                     "insert/*",
//                     "types/*",
//                 ],

//                 message: "Non-relative imports from src are forbidden. Please use a relative path instead",
//             }],
//         }],
//     },
// }, {
//     files: ["**/*.spec.ts"],

//     rules: {
//         "@typescript-eslint/unbound-method": "off",
//     },
// }];


// export default [{
//     ignores: [
// 		"**/node_modules/",
//         "**/*.js",
//         "**/dist",
//         "src/__vendor",
//         "**/.eslintrc.js",
//         "src/lib/__mocks__/ad-sizes.ts",

//     ],
// }, ...fixupConfigRules(
//     compat.extends("@guardian/eslint-config"),
// ), {
//     plugins: {
//         "@typescript-eslint": typescriptEslint,
//         import: fixupPluginRules(_import),
//     },

//     languageOptions: {
//         globals: {
//             ...globals.jest,
//             ...globals.browser,
//             ...globals.node,
//             googletag: "readonly",
//         },

//         ecmaVersion: 5,
//         sourceType: "commonjs",

//         parserOptions: {
//             project: ["./tsconfig.json"],
//             tsconfigRootDir: "./",
//         },
//     },

//     settings: {
//         "import/resolver": {
//             alias: {
//                 map: [["svgs", "./static/svg"]],
//             },
//         },
//     },

//     rules: {
//         "id-denylist": ["error"],
//         "@typescript-eslint/no-unsafe-argument": "off",
//         "@typescript-eslint/no-unsafe-return": "off",
//         "@typescript-eslint/unbound-method": "off",
//         curly: ["error", "multi-line"],

//         "no-use-before-define": ["error", {
//             functions: true,
//             classes: true,
//         }],

//         "import/exports-last": "error",
//         "no-else-return": "error",

//         "no-restricted-imports": ["error", {
//             patterns: [{
//                 group: [
//                     "define/*",
//                     "display/*",
//                     "events/*",
//                     "experiments/*",
//                     "init/*",
//                     "lib/*",
//                     "insert/*",
//                     "types/*",
//                 ],

//                 message: "Non-relative imports from src are forbidden. Please use a relative path instead",
//             }],
//         }],
//     },
// }, {
//     files: ["**/*.spec.ts"],

//     rules: {
//         "@typescript-eslint/unbound-method": "off",
//     },
// }];
