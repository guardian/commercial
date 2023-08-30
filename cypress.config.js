import { defineConfig } from 'cypress';

// eslint-disable-next-line import/no-default-export -- cypress api
export default defineConfig({
	chromeWebSecurity: false,
	defaultCommandTimeout: 15000,
	blockHosts: ['ophan.theguardian.com'],
	retries: {
		runMode: 2,
		openMode: 0,
	},
	// Record videos in CI
	// In the GHA we'll only record failures, to minimize storage
	video: !!process.env.CI,
	e2e: {
		setupNodeEvents(on, config) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-var-requires -- cypress api
			return require('./cypress/plugins/index.ts').default(on, config);
		},
	},
	// Test files like merchandising.cy.ts that take a few minutes to run exceed the memory limit
	// causing the browser to crash. Since we're not using snapshots at the moment, work around the
	// issue by not saving tests to memory. https://github.com/cypress-io/cypress/issues/1906
	numTestsKeptInMemory: 0,
});
