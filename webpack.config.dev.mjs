import { join } from 'path';
import { merge } from 'webpack-merge';
import { setupFixturesServer } from './scripts/fixtures/fixtures-server.js';
import defaultConfig from './webpack.config.mjs';
import prebid946Config from './webpack.config.prebid946.mjs';

const port = 3031;

const buildPrebid946 = process.env.BUILD_PREBID946 === 'true';

const config = buildPrebid946 ? prebid946Config : defaultConfig;

export default merge(config, {
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.${buildPrebid946 ? 'prebid946.' : ''}standalone.commercial.js`,
		chunkFilename: `graun.${buildPrebid946 ? 'prebid946.' : ''}[name].commercial.js`,
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
