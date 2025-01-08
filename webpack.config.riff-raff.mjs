import { execSync } from 'child_process';
import { join } from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';
import config from './webpack.config.mjs';

const { DefinePlugin } = webpack;

class GenerateCloudformation {
	apply = (compiler) => {
		compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
			const entry = compilation.entrypoints.get('commercial-standalone');

			const hashedFilePath = entry?.getFiles()[0];

			if (!hashedFilePath) {
				throw new Error(
					'Could not find hashed file for commercial-standalone',
				);
			}

			const stages = ['code', 'prod'];
			stages.forEach((stage) => {
				/**
				 * This small bit of cloudformation will update the SSM parameter that frontend
				 * reads to get the bundle path.
				 */
				const cloudformation = {
					Resources: {
						BundlePath: {
							Type: 'AWS::SSM::Parameter',
							Properties: {
								Name: `/frontend/${stage}/commercial.bundlePath`,
								Type: 'String',
								Value: hashedFilePath,
							},
						},
					},
				};

				// If we're in prod, we also want to update the dev bundle path
				if (stage === 'prod') {
					cloudformation.Resources.DevBundlePath = {
						Type: 'AWS::SSM::Parameter',
						Properties: {
							Name: '/frontend/dev/commercial.bundlePath',
							Type: 'String',
							Value: hashedFilePath,
						},
					};
				}

				const output = JSON.stringify(cloudformation, null, 2);
				const outputPath = join(
					import.meta.dirname,
					'dist',
					'riff-raff',
					'cloudformation',
					`${stage}.json`,
				);
				compiler.outputFileSystem.mkdirSync(
					join(
						import.meta.dirname,
						'dist',
						'riff-raff',
						'cloudformation',
					),
					{ recursive: true },
				);
				compiler.outputFileSystem.writeFileSync(outputPath, output);
			});
		});
	};
}

const gitCommitSHA = () => {
	try {
		const commitSHA = execSync('git rev-parse HEAD').toString().trim();
		return { 'process.env.COMMIT_SHA': JSON.stringify(commitSHA) };
	} catch (_) {
		return {};
	}
};

const prefix = process.env.BUNDLE_PREFIX ?? '[chunkhash]/';

// eslint-disable-next-line import/no-default-export -- webpack config
export default merge(config, {
	mode: 'production',
	output: {
		filename: `commercial/${prefix}graun.standalone.commercial.js`,
		chunkFilename: `commercial/${prefix}graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'riff-raff', 'js'),
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
		new DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
			'process.env.OVERRIDE_BUNDLE_PATH': JSON.stringify(false),
			'process.env.RIFFRAFF_DEPLOY': JSON.stringify(true),
			...gitCommitSHA(),
		}),
		new GenerateCloudformation(),
	],
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				minify: TerserPlugin.swcMinify,
				terserOptions: {
					mangle: true,
					compress: true,
				},
			}),
		],
	},
});
