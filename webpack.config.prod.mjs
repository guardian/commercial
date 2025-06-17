import { join } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import { PROutPlugin } from './webpack/prout-plugin.mjs';
import { UpdateParameterStorePlugin } from './webpack/update-parameter-store-plugin.mjs';
import defaultConfig from './webpack.config.mjs';
import prebid946Config from './webpack.config.prebid946.mjs';

const prefix = process.env.BUNDLE_PREFIX ?? '[chunkhash]/';

// const buildPrebid946 = process.env.BUILD_PREBID946 === 'true';

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
		// new UpdateParameterStorePlugin({ prebid946 : false }),
		// new PROutPlugin(),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
})];

// if (buildPrebid946) {
	config.push(merge(prebid946Config, {
		mode: 'production',
		output: {
			filename: `commercial-prebid946/${prefix}graun.standalone.commercial.js`,
			chunkFilename: `commercial-prebid946/${prefix}graun.[name].commercial.js`,
			path: join(import.meta.dirname, 'dist', 'prod', 'artifacts'),
			publicPath: 'auto',
			clean: false,
		},
		devtool: 'source-map',
		plugins: [
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- circular-dependency-plugin is not typed
			new BundleAnalyzerPlugin({
				reportFilename: './commercial-prebid946-bundle-analyzer-report.html',
				analyzerMode: 'static',
				openAnalyzer: false,
			}),
			// new UpdateParameterStorePlugin({ prebid946 : true }),
		],
		optimization: {
			minimize: true,
			minimizer: [new TerserPlugin()],
		},
	}))
// };

export default config;
