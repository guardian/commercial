const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');

module.exports = {
	entry: {
		'commercial-standalone': path.join(__dirname, 'src', 'commercial.ts'),
	},
	output: {
		path: path.join(__dirname, 'dist', 'bundle'),
		clean: true,
	},
	resolve: {
		modules: [
			path.join(__dirname, 'src'),
			'node_modules', // default location, but we're overiding above, so it needs to be explicit
		],
		alias: {
			svgs: path.join(__dirname, 'static', 'svg'),
			lodash: 'lodash-es',
		},
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
		// Originally inserted to enable linking @guardian/consent-management-platform, breaks pnpm build
		// symlinks: false,
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
							configFile: path.join(__dirname, 'tsconfig.json'),
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
		new CircularDependencyPlugin({
			// exclude detection of files based on a RegExp
			exclude: /node_modules/,
			// add errors to webpack instead of warnings
			failOnError: true,
		}),
	],
};
