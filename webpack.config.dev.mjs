import { join } from 'path';
import { merge } from 'webpack-merge';
import { setupFixturesServer } from './scripts/fixtures/fixtures-server.js';
import config from './webpack.config.mjs';

const port = 3031;

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
