import { join } from 'path';
import { merge } from 'webpack-merge';
import { setupFixturesServer } from './scripts/fixtures/fixtures-server.js';
import config from './webpack.config.mjs';
import prebid946Config from './webpack.config.prebid946.mjs';

const port = 3031;

/** @type {import('webpack-dev-server').Configuration} */
const devServerConfig = {
	port,
	compress: true,
	hot: false,
	liveReload: true,
	setupMiddlewares: (middlewares, devServer) => {
		setupFixturesServer(devServer);

		return middlewares;
	},
};

const servePrebid946 = process.env.SERVE_PREBID946 === 'true';

export default [
	merge(config, {
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.standalone.commercial.js`,
		chunkFilename: `graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'bundle', 'dev'),
		clean: true,
	},
	...(!servePrebid946 && { devServer: devServerConfig }),
}),
merge(prebid946Config, {
	devtool: 'inline-source-map',
	mode: 'development',
	output: {
		filename: `graun.prebid946.standalone.commercial.js`,
		chunkFilename: `graun.prebid946.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'bundle', 'dev'),
		clean: true,
	},
	...(servePrebid946 && { devServer: devServerConfig }),
})]
