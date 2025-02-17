import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './playwright/tests',
	// Don't run tests _within_ files in parallel as this causes flakiness locally - investigating
	// Test files still run in parallel as per the number of workers set below
	fullyParallel: false,
	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,
	// Retry
	retries: process.env.CI ? 2 : 1,
	// Workers run tests files in parallel
	workers: process.env.CI ? 4 : undefined,
	// Reporter to use. See https://playwright.dev/docs/test-reporters
	reporter: [['line'], ['html', { open: 'never' }]],
	// Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions
	use: {
		// Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: {
			mode: 'retain-on-failure',
		},
	},
	// Configure projects for major browsers
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
});
