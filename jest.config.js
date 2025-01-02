// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const esModules = ['@guardian/', 'lodash-es'].join('|');

module.exports = {
	clearMocks: true,
	testMatch: ['**/*.(test|spec).+(ts|tsx|js)'],
	roots: ['<rootDir>/src'],
	moduleDirectories: ['<rootDir>/src', 'node_modules'],
	moduleNameMapper: {
		'^svgs/(.*)$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.html$': '<rootDir>/src/__mocks__/templateMock.js',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setupTestFrameworkScriptFile.js'],
	testEnvironment: 'jest-environment-jsdom-global',
	testEnvironmentOptions: {
		url: 'http://testurl.theguardian.com',
	},
	transformIgnorePatterns: [`/node_modules/.pnpm/(?!${esModules})`],
	transform: {
		'^.+\\.(ts|tsx|js)$': '@swc/jest',
	},
};
