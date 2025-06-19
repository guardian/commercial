import { join } from 'path';
import { merge } from 'webpack-merge';
import { setupFixturesServer } from './scripts/fixtures/fixtures-server.js';
import defaultConfig from './webpack.config.mjs';
import prebidTestConfig from './webpack.config.prebidTest.mjs';

const port = 3031;

const buildPrebidTest = process.env.BUILD_PREBID946 === 'true';

const config = buildPrebidTest ? prebidTestConfig : defaultConfig;

export default merge(config, {
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.${buildPrebidTest ? 'prebidTest.' : ''}standalone.commercial.js`,
		chunkFilename: `graun.${buildPrebidTest ? 'prebidTest.' : ''}[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'bundle', 'dev'),
		clean: true,
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
})
