import { join } from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import { setupFixturesServer } from './scripts/fixtures/fixtures-server.js';
import config from './webpack.config.mjs';

const { DefinePlugin, ProvidePlugin } = webpack;

const port = 3031;
const overrideBundlePath = `http://localhost:${port}/`;
const shouldOverrideBundle = !!process.env.OVERRIDE_BUNDLE;

// eslint-disable-next-line import/no-default-export -- webpack config
export default merge(config, {
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.standalone.commercial.js`,
		chunkFilename: `graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'bundle', 'dev'),
		clean: true,
	},
	plugins: shouldOverrideBundle
		? [
				new ProvidePlugin({
					process: 'process/browser',
				}),
				new DefinePlugin({
					'process.env.OVERRIDE_BUNDLE_PATH':
						JSON.stringify(overrideBundlePath),
				}),
			]
		: [
				new ProvidePlugin({
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
		setupMiddlewares: (middlewares, devServer) => {
			setupFixturesServer(devServer);

			return middlewares;
		},
	},
});
