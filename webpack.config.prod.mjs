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

			const stages = ['code', 'prod'];
			stages.forEach((stage) => {
				const cloudformation = {
					Resources: {
						BundlePath: {
							Type: 'AWS::SSM::Parameter',
							Properties: {
								Name: `/frontend${stage === 'code' ? '/code' : ''}/commercial.bundlePath`,
								Type: 'String',
								Value: entry?.getFiles()[0],
							},
						},
					},
				};

				const output = JSON.stringify(cloudformation, null, 2);
				const outputPath = join(
					import.meta.dirname,
					'dist',
					'bundle',
					'prod',
					'cloudformation',
					`${stage}.json`,
				);
				compiler.outputFileSystem.mkdirSync(
					join(
						import.meta.dirname,
						'dist',
						'bundle',
						'prod',
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
		filename: `${prefix}graun.standalone.commercial.js`,
		chunkFilename: `${prefix}graun.[name].commercial.js`,
		path: join(import.meta.dirname, 'dist', 'bundle', 'prod', 'js'),
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
			...gitCommitSHA(),
		}),
		new GenerateCloudformation(),
	],
	optimization: {
		minimize: true,
		minimizer: [new TerserPlugin()],
	},
});
