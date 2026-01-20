import repoJestConfig from '../jest.config.js';

const jestConfig = {
	...repoJestConfig,
	/**
	 * We want to continuously increase these thresholds as we add more test coverage
	 * If you need to lower the thresholds you can, but this should be a last resort
	 */
	coverageThreshold: {
		global: {
			branches: 45,
			functions: 41,
			lines: 61,
			statements: 61,
		},
		/**
		 * Higher testing threshold for the src/lib directory
		 * It's easy to dump files in lib without thinking about it
		 * By having a higher threshold we ensure that testing is considered more
		 */
		'./src/lib': {
			branches: 61,
			functions: 66,
			lines: 74,
			statements: 75,
		},
		/**
		 * Higher testing threshold for the src/init/consented directory
		 * These files are particularly important for commercial logic
		 */
		'./src/init/consented': {
			branches: 68,
			functions: 76,
			lines: 84,
			statements: 84,
		},
	},
};

export default jestConfig;
