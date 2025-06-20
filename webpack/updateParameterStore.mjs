import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

export const updateParameterStore = (children, outputPath) => {
	const cloudformation = {
		Resources: {},
	};
	const stages = ['code', 'prod'];

	stages.forEach((stage) => {
		children.forEach((child) => {
			const { entrypoints } = child;
			const hashedFilePath =
				entrypoints['commercial-standalone'].assets[0].name;
			const isPrebidTest =
				entrypoints['commercial-standalone'].assets[0].name.includes(
					'prebidTest',
				);
			const resourceKey = `${isPrebidTest ? 'PrebidTest' : ''}BundlePath`;

			/**
			 * This small bit of cloudformation will update the SSM parameter that frontend
			 * reads to get the bundle path.
			 */
			cloudformation.Resources[resourceKey] = {
				Type: 'AWS::SSM::Parameter',
				Properties: {
					Name: `/frontend/${stage}/commercial${isPrebidTest ? '.prebidTest' : ''}.bundlePath`,
					Type: 'String',
					Value: hashedFilePath,
				},
			};

			// If we're in prod, we also want to update the dev bundle path
			if (stage === 'prod') {
				cloudformation.Resources[`Dev${resourceKey}`] = {
					Type: 'AWS::SSM::Parameter',
					Properties: {
						Name: `/frontend/dev/commercial${isPrebidTest ? '.prebidTest' : ''}.bundlePath`,
						Type: 'String',
						Value: hashedFilePath,
					},
				};
			}
		});

		const cloudformationOutput = JSON.stringify(cloudformation, null, 2);
		const cloudformationOutputDir = join(
			outputPath,
			'..',
			'cloudformation',
		);
		const cloudformationOutputFile = join(
			cloudformationOutputDir,
			`${stage}.json`,
		);

		mkdirSync(cloudformationOutputDir, { recursive: true });
		writeFileSync(cloudformationOutputFile, cloudformationOutput, 'utf-8');
	});
};
