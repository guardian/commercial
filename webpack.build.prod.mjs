import webpack from 'webpack';
import prodConfig from './webpack.config.prod.mjs';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

const updateParameterStore = (children) => {
	const cloudformation = {
		Resources: {}
	};
	const stages = ['code', 'prod'];

	stages.forEach((stage) => {
		children.forEach((child) => {
			const { entrypoints } = child;
			const hashedFilePath = entrypoints['commercial-standalone'].assets[0].name;
			const isPrebidTest = entrypoints['commercial-standalone'].assets[0].name.includes('prebidTest');
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
				}
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

const prout = (outputPath) => {
	const commitSHA = execSync('git rev-parse HEAD').toString().trim();

	const proutOutputPath = join(
		outputPath,
		'commercial',
		`prout`,
	);

	writeFileSync(
		proutOutputPath,
		`Commercial bundle commit hash: ${commitSHA}`,
	);
}

webpack(prodConfig, (err, stats) => {
	if (err) {
		console.error('Webpack build failed:', err);
		process.exit(1);
	}

	if (stats.hasErrors()) {
		console.error('Webpack compilation errors:\n', stats.toString({ colors: true }));
		process.exit(1);
	}

	/**
	 * Each child in the generated compilation stats represents a
	 * config in our multi config prodConfig export.
	**/
	const { children } = stats.toJson({ entrypoints: true });
	/**
	 * outputPath is used when saving the cloudformation.json, it
	 * goes in the same directory as the generated artificats.
	 * As we use the same outputPath for all artificats we can
	 * pull this from the first child.
	**/
	const { outputPath } = children[0];

	updateParameterStore(children, outputPath);
	prout(outputPath);
});
