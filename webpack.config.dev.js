const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const config = require('./webpack.config.js');
const path = require('path');
const {
	setupFixturesServer,
} = require('./scripts/fixtures/fixtures-server.js');

const port = 3031;
const overrideBundlePath = `http://localhost:${port}/`;
const shouldOverrideBundle = !!process.env.OVERRIDE_BUNDLE;

module.exports = webpackMerge.smart(config, {
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
	/** @type {import('webpack-dev-server').Configuration} */
	devServer: {
		port,
		compress: true,
		hot: false,
		liveReload: true,
		onAfterSetupMiddleware: setupFixturesServer,
		static: {
			directory: path.join(__dirname, 'static'),
		},
		allowedHosts: 'all',
		watchFiles: [path.join(__dirname, 'src')],

		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods':
				'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers':
				'X-Requested-With, content-type, Authorization',
		},
	},
});
