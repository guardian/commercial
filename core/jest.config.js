import repoJestConfig from '../jest.config.js';

const jestConfig = {
	...repoJestConfig,
	/**
	 * We want to continuously increase these thresholds as we add more test coverage
	 * If you need to lower the thresholds you can, but this should be a last resort
	 */
	coverageThreshold: {
		global: {
			branches: 96,
			functions: 97,
			lines: 98,
			statements: 98,
		},
	},
};

export default jestConfig;
