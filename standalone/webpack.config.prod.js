const webpackMerge = require('webpack-merge');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const config = require('./webpack.config.js');

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
		new UglifyJSPlugin({
			parallel: true,
			sourceMap: true,
		}),
	],
});
