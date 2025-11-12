// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const esModules = [
	'@guardian/',
	'lodash-es',
	'prebid.js',
	'prebid-v10.11.0.js',
	'dlv',
].join('|');

module.exports = {
	clearMocks: true,
	preset: 'ts-jest/presets/js-with-babel',
	moduleFileExtensions: ['ts', 'tsx', 'js'],
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
		'^prebid.js/adapters/(.*)$':
			'<rootDir>/node_modules/prebid.js/src/adapters/$1',
		'^prebid.js/(.*)$': '<rootDir>/node_modules/prebid.js/$1',
		'^prebid-v10.11.0.js/adapters/(.*)$':
			'<rootDir>/node_modules/prebid-v10.11.0.js/src/adapters/$1',
		'^prebid-v10.11.0.js/(.*)$':
			'<rootDir>/node_modules/prebid-v10.11.0.js/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/../jest.setupTestFrameworkScriptFile.js'],
	testEnvironment: 'jest-environment-jsdom-global',
	testEnvironmentOptions: {
		url: 'http://testurl.theguardian.com',
	},
	transformIgnorePatterns: [`/node_modules/.pnpm/(?!${esModules})`],
	transform: {
		'node_modules/.pnpm/prebid(.*)?\\.js$': [
			'babel-jest',
			{ configFile: 'prebid.js/.babelrc.js' },
		],
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
};
