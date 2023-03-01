const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');

module.exports = {
	entry: {
		'commercial-standalone': path.join(
			__dirname,
			'src',
			'bootstraps',
			'standalone.commercial.ts',
		),
	},
	output: {
		path: path.join(__dirname, 'dist'),
		clean: true,
	},
	resolve: {
		modules: [
			path.join(__dirname, 'src'),
			'node_modules', // default location, but we're overiding above, so it needs to be explicit
		],
		alias: {
			common: 'projects/common',
			commercial: 'projects/commercial',
			svgs: path.join(__dirname, 'static', 'svg'),
			'ophan/ng': 'ophan-tracker-js',
			lodash: 'lodash-es',
		},
		extensions: ['.js', '.ts', '.tsx', '.jsx'],
		symlinks: false, // Inserted to enable linking @guardian/consent-management-platform
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
