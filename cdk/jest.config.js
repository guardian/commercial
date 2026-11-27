import repoJestConfig from '../jest.config.js';

const jestConfig = {
	...repoJestConfig,
	roots: ['.'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs', 'json'],
	testEnvironment: 'node',
	setupFilesAfterEnv: [],
};

export default jestConfig;
