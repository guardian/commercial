import { join } from 'path';

export class UpdateParameterStorePlugin {
	/**
	 * @param {import('webpack').Compiler} compiler
	 */
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
