import { join } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import { PROutPlugin } from './webpack/prout-plugin.mjs';
import { UpdateParameterStorePlugin } from './webpack/update-parameter-store-plugin.mjs';
import defaultConfig from './webpack.config.mjs';
import prebidTestConfig from './webpack.config.prebidTest.mjs';

const prefix = process.env.BUNDLE_PREFIX ?? '[chunkhash]/';

const config = [merge(defaultConfig, {
	mode: 'production',
	output: {
		filename: `commercial/${prefix}graun.standalone.commercial.js`,
		chunkFilename: `commercial/${prefix}graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'prod', 'artifacts'),
		publicPath: 'auto',
		clean: true,
	},
	devtool: 'source-map',
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- circular-dependency-plugin is not typed
		new BundleAnalyzerPlugin({
			reportFilename: './commercial-bundle-analyzer-report.html',
			analyzerMode: 'static',
			openAnalyzer: false,
		}),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
}), merge(prebidTestConfig, {
	mode: 'production',
	output: {
		filename: `commercial-prebidTest/${prefix}graun.standalone.commercial.js`,
		chunkFilename: `commercial-prebidTest/${prefix}graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'prod', 'artifacts'),
		publicPath: 'auto',
		clean: false,
	},
	devtool: 'source-map',
	plugins: [
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- circular-dependency-plugin is not typed
		new BundleAnalyzerPlugin({
			reportFilename: './commercial-prebidTest-bundle-analyzer-report.html',
			analyzerMode: 'static',
			openAnalyzer: false,
		}),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
})];

console.log('*** 1',  JSON.stringify(config[1]));

// console.log('*** 1', config[1]);

export default config;
