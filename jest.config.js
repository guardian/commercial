// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
	preset: 'ts-jest/presets/js-with-ts',
	clearMocks: true,
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*'],
	coveragePathIgnorePatterns: ['vendor'],
	testEnvironment: 'jsdom',
};
