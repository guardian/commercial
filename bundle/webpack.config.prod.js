const webpackMerge = require('webpack-merge');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const config = require('./webpack.config.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = webpackMerge.smart(config, {
	mode: 'production',
	output: {
		filename: `[chunkhash]/graun.standalone.commercial.js`,
		chunkFilename: `[chunkhash]/graun.[name].commercial.js`,
	},
	devtool: 'source-map',
	plugins: [
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
});
