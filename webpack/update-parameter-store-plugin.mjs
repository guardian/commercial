import { join } from 'path';

export class UpdateParameterStorePlugin {
	static defaultOptions = {
		prebid946: false,
	};

	constructor(options = {}) {
		this.options = { ...UpdateParameterStorePlugin.defaultOptions, ...options };
	}

	/**
	 * @param {import('webpack').Compiler} compiler
	 */
	apply = (compiler) => {
		compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
			const entry = compilation.entrypoints.get('commercial-standalone');

			const hashedFilePath = entry?.getFiles()[0];

			const { prebid946 } = this.options;

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
				const newCloudFormationData = {
					Resources: {
						[prebid946 ? 'Prebid946BundlePath' : 'BundlePath']: {
							Type: 'AWS::SSM::Parameter',
							Properties: {
								Name: `/frontend/${stage}/commercial${prebid946 ? '-prebid946' : ''}.bundlePath`,
								Type: 'String',
								Value: hashedFilePath,
							},
						},
					},
				};

				// If we're in prod, we also want to update the dev bundle path
				if (stage === 'prod') {
					newCloudFormationData.Resources[prebid946 ? 'Prebid946DevBundlePath' : 'DevBundlePath'] = {
						Type: 'AWS::SSM::Parameter',
						Properties: {
							Name: `/frontend/dev/commercial${prebid946 ? '-prebid946' : ''}.bundlePath`,
							Type: 'String',
							Value: hashedFilePath,
						},
					};
				}

				const outputPath = join(
					compilation.outputOptions.path,
					'..',
					'cloudformation',
					`${stage}.json`,
				);

				let existingCloudFormationData = {};

				try {
					if (compiler.outputFileSystem.existsSync(outputPath)) {
						const existingContent = compiler.outputFileSystem.readFileSync(outputPath, 'utf-8');
						existingCloudFormationData = JSON.parse(existingContent);
					}
				} catch (error) {
					compilation.warnings.push(new Error(`Failed to read existing file: ${outputPath}: ${error.message}`));
				}

				const newContent = {
					Resources: {
						...existingCloudFormationData.Resources,
						...newCloudFormationData.Resources
					}
				};

				const output = JSON.stringify(newContent, null, 2);

				compiler.outputFileSystem.mkdirSync(
					join(
						compilation.outputOptions.path,
						'..',
						'cloudformation',
					),
					{ recursive: true },
				);

				compiler.outputFileSystem.writeFileSync(outputPath, output);
			});
		});
	};
}
