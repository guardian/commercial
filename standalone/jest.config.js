// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
	preset: 'ts-jest/presets/js-with-babel',
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.test.json',
		},
	},
	moduleFileExtensions: ['ts', 'tsx', 'js'],
	testMatch: ['**/*.(test|spec).+(ts|tsx|js)'],
	roots: ['<rootDir>/src'],
	moduleDirectories: [
		'<rootDir>/src',
		'<rootDir>/src/projects',
		'node_modules',
	],
	moduleNameMapper: {
		videojs: 'video.js',
		'^svgs/(.*)$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.html$': '<rootDir>/src/__mocks__/templateMock.js',
		'ophan/ng': 'ophan-tracker-js',
		'ophan/embed': 'ophan-tracker-js/build/ophan.embed',
		'^common/(.*)$': '<rootDir>/src/projects/common/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setupTestFrameworkScriptFile.js'],
	testEnvironment: 'jest-environment-jsdom-global',
	testEnvironmentOptions: {
		url: 'http://testurl.theguardian.com',
	},
	transformIgnorePatterns: ['/node_modules/(?!(@guardian|lodash-es)/)'],
};
