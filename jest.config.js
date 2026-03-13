// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const esModules = ['@guardian/', 'lodash-es', 'prebid.js', 'dlv'].join('|');

const prebidBabelOptions = {
	configFile: './node_modules/prebid.js/.babelrc.js',
};

module.exports = {
	clearMocks: true,
	preset: 'ts-jest/presets/js-with-babel',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'mjs'],
	testMatch: ['**/*.(test|spec).+(ts|tsx|js)'],
	roots: ['<rootDir>/src'],
	moduleDirectories: ['<rootDir>/src', 'node_modules'],
	moduleNameMapper: {
		videojs: 'video.js',
		raven: '<rootDir>/src/lib/__mocks__/raven.ts',
		'^@guardian/commercial-core$': '<rootDir>/../core/src/index.ts',
		'^@guardian/commercial-core/(.*)$': '<rootDir>/../core/src/$1.ts',
		'^svgs/(.*)$': '<rootDir>/src/lib/__mocks__/svgMock.js',
		'^(.*)\\.svg$': '<rootDir>/src/lib/__mocks__/svgMock.js',
		'^(.*)\\.html$': '<rootDir>/src/__mocks__/templateMock.js',
		'^prebid.js/dist/(.*)$': '<rootDir>/node_modules/prebid.js/dist/src/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/../jest.setupTestFrameworkScriptFile.js'],
	testEnvironment: 'jest-environment-jsdom-global',
	testEnvironmentOptions: {
		url: 'http://testurl.theguardian.com',
	},
	transformIgnorePatterns: [`/node_modules/\\.pnpm/(?!${esModules})`],
	transform: {
		// 'node_modules/.pnpm/prebid(.*)?\\.js$': [
		// 	'babel-jest',
		// 	prebidBabelOptions,
		// ],
		'^.+\\.mjs$': 'babel-jest',
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
};
