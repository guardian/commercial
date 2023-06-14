const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const config = require('./webpack.config.js');
const path = require('path');

const port = 3031;
const overrideBundlePath = `http://localhost:${port}/`;
const shouldOverrideBundle = !!process.env.OVERRIDE_BUNDLE;

module.exports = webpackMerge.smart(config, {
	/** @type {import('webpack-dev-server').Configuration} */
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.standalone.commercial.js`,
		chunkFilename: `graun.[name].commercial.js`,
		path: path.join(__dirname, 'dist', 'bundle', 'dev'),
		clean: true,
	},
	plugins: shouldOverrideBundle
		? [
				new webpack.ProvidePlugin({
					process: 'process/browser',
				}),
				new webpack.DefinePlugin({
					'process.env.OVERRIDE_BUNDLE_PATH':
						JSON.stringify(overrideBundlePath),
				}),
		  ]
		: [
				new webpack.ProvidePlugin({
					process: 'process/browser',
				}),
		  ],

	resolve: {
		alias: {
			process: 'process/browser',
		},
	},
	devServer: {
		port,
		compress: true,
		hot: false,
		liveReload: true,
	},
});
