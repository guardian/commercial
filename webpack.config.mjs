import { join } from 'path';
import CircularDependencyPlugin from 'circular-dependency-plugin';

/**
 * @type {import('webpack').Configuration}
 */
const config = {
	entry: {
		'commercial-standalone': join(
			import.meta.dirname,
			'src',
			'commercial.ts',
		),
	},
	output: {
		path: join(import.meta.dirname, 'dist', 'bundle'),
		clean: true,
	},
	resolve: {
		modules: [
			join(import.meta.dirname, 'src'),
			'node_modules', // default location, but we're overiding above, so it needs to be explicit
		],
		alias: {
			svgs: join(import.meta.dirname, 'static', 'svg'),
			lodash: 'lodash-es',
		},
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
	},
	module: {
		rules: [
			{
				test: /\.[jt]sx?|mjs$/,
				exclude: {
					and: [/node_modules/],
					not: [
						// Include all @guardian modules, except automat-modules
						/@guardian\/(?!(automat-modules))/,
						// Include the dynamic-import-polyfill
						/dynamic-import-polyfill/,
					],
				},
				use: [
					{
						loader: 'swc-loader',
						options: {
							$schema: 'http://json.schemastore.org/swcrc',
							jsc: {
								parser: {
									syntax: 'typescript',
									decorators: false,
									dynamicImport: true,
								},
							},
							sourceMaps: true,
							env: {
								dynamicImport: true,
							},
						},
					},
				],
			},
			{
				test: /\.svg$/,
				exclude: /(node_modules)/,
				loader: 'raw-loader',
			},
		],
	},
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- circular-dependency-plugin is not typed
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// add errors to webpack instead of warnings
			failOnError: true,
		}),
	],
};

// eslint-disable-next-line import/no-default-export -- webpack config
export default config;
