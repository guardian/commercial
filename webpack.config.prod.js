const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const config = require('./webpack.config.js');
const TerserPlugin = require('terser-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const path = require('path');
const { execSync } = require('child_process');

const gitCommitSHA = () => {
	try {
		const commitSHA = execSync('git rev-parse HEAD').toString().trim();
		return { 'process.env.COMMIT_SHA': JSON.stringify(commitSHA) };
	} catch (_) {
		return {};
	}
};

module.exports = webpackMerge.smart(config, {
	mode: 'production',
	output: {
		filename: `[chunkhash]/graun.standalone.commercial.js`,
		chunkFilename: `[chunkhash]/graun.[name].commercial.js`,
		path: path.join(__dirname, 'dist', 'bundle', 'prod'),
		clean: true,
	},
	devtool: 'source-map',
	plugins: [
		new BundleAnalyzerPlugin({
			reportFilename: './commercial-bundle-analyzer-report.html',
			analyzerMode: 'static',
			openAnalyzer: false,
		}),
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
			'process.env.OVERRIDE_BUNDLE_PATH': JSON.stringify(false),
			...gitCommitSHA(),
		}),
		new WebpackManifestPlugin({
			publicPath: '',
			fileName: 'assets.map',
		}),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
});
