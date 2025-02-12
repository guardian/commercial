import { execSync } from 'child_process';
import { join } from 'path';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import webpack from 'webpack';

const gitCommitSHA = () => {
	try {
		return execSync('git rev-parse HEAD').toString().trim();
	} catch (_) {
		return;
	}
};

const { DefinePlugin } = webpack;

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
				use: [
					{
						loader: 'babel-loader',
					},
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true,
							configFile: join(
								import.meta.dirname,
								'tsconfig.json',
							),
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
		new DefinePlugin({
			'process.env.COMMIT_SHA': JSON.stringify(gitCommitSHA()),
		}),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- circular-dependency-plugin is not typed
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// add errors to webpack instead of warnings
			failOnError: true,
		}),
	],
};

export default config;
