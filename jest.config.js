// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
	preset: 'ts-jest/presets/js-with-ts',
	clearMocks: true,
	// collectCoverage: true,
	collectCoverageFrom: ['src/**/*'],
	coveragePathIgnorePatterns: ['vendor'],
	transformIgnorePatterns: ['/node_modules/(?!@guardian/)'],
	setupFiles: ['./jest.setup.js'],
	testEnvironment: 'jest-environment-jsdom-global',
	testURL: 'http://testurl.theguardian.com',
	moduleDirectories: [
		'node_modules/@guardian/frontend/static/src/javascripts',
		'node_modules/@guardian/frontend/static/src/javascripts/projects',
		'node_modules/@guardian/frontend/static/vendor/javascripts',
		'node_modules',
	],
	moduleNameMapper: {
		'^svgs/(.*)$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.svg$': '<rootDir>/src/__mocks__/svgMock.js',
		'^(.*)\\.html$': '<rootDir>/src/__mocks__/templateMock.js',
		'ophan/ng': 'ophan-tracker-js',
		'ophan/embed': 'ophan-tracker-js/build/ophan.embed',
	},
};
