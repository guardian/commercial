import { execSync } from 'child_process';
import { join } from 'path';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import prebidBabelOptions from 'prebid.js/.babelrc.js';
import prebid946BabelOptions from 'prebid-v9.46.0.js/.babelrc.js';

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
			// prebid doesn't export these directories, so we need to alias them,
			// we use them for our custom modules located in src/lib/header-bidding/prebid/custom-modules
			'prebid.js/src': join(
				import.meta.dirname,
				'node_modules',
				'prebid.js',
				'src',
			),
			'prebid.js/libraries': join(
				import.meta.dirname,
				'node_modules',
				'prebid.js',
				'libraries',
			),
			'prebid.js/adapters': join(
				import.meta.dirname,
				'node_modules',
				'prebid.js',
				'src',
				'adapters',
			),
			/**
			 * The aliases below for prebid-v9.46.0.js
			 * can be deleted once we've tested this dependency
			 **/
			'prebid-v9.46.0.js/src': join(
				import.meta.dirname,
				'node_modules',
				'prebid-v9.46.0.js',
				'src',
			),
			'prebid-v9.46.0.js/libraries': join(
				import.meta.dirname,
				'node_modules',
				'prebid-v9.46.0.js',
				'libraries',
			),
			'prebid-v9.46.0.js/adapters': join(
				import.meta.dirname,
				'node_modules',
				'prebid-v9.46.0.js',
				'src',
				'adapters',
			),
		},
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
		conditionNames: ['development', 'import', 'default'],
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
				test: /.js$/,
				include: /prebid\.js/,
				use: {
					loader: 'babel-loader',
					options: prebidBabelOptions,
				},
			},
			/**
			 * The rule below for prebid-v9.46.0.js
			 * can be deleted once we've tested this dependency
			 **/
			{
				test: /.js$/,
				include: /prebid\.js@9\.46\.0/,
				use: {
					loader: 'babel-loader',
					options: prebid946BabelOptions,
				},
			},
			{
				test: /\.svg$/,
				exclude: /(node_modules)/,
				loader: 'raw-loader',
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: join(
				import.meta.dirname,
				'static',
				'tpc-test-iframe',
				'v2',
				'index.html',
			),
			filename: `commercial/tpc-test/v2/index.html`,
			minify: {
				collapseWhitespace: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true,
				minifyJS: true,
			},
			inject: false,
		}),
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
