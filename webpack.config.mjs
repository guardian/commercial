import { join } from 'path';
import browserslist from 'browserslist';
import CircularDependencyPlugin from 'circular-dependency-plugin';

const targets = browserslist('extends @guardian/browserslist-config');

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
		extensions: ['.js', '.ts'],
	},
	module: {
		rules: [
			{
				test: /\.[jt]s|mjs$/,
				use: [
					{
						loader: 'swc-loader',
						options: {
							$schema: 'http://json.schemastore.org/swcrc',
							jsc: {
								parser: {
									syntax: 'typescript',
									dynamicImport: true,
								},
							},
							sourceMaps: true,
							env: {
								dynamicImport: true,
								targets,
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
