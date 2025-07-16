import { join } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import { PROutPlugin } from './webpack/prout-plugin.mjs';
import { UpdateParameterStorePlugin } from './webpack/update-parameter-store-plugin.mjs';
import config from './webpack.config.mjs';

const prefix = process.env.BUNDLE_PREFIX ?? '[chunkhash]/';

export default merge(config, {
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
		new UpdateParameterStorePlugin(),
		new PROutPlugin(),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
});
