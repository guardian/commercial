import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './benchmark/tests',
	// Don't run tests _within_ files in parallel as this causes flakiness locally - investigating
	// Test files still run in parallel as per the number of workers set below
	fullyParallel: true,
	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,
	// Retry
	retries: 0,
	// Workers run tests files in parallel
	workers: process.env.CI ? 4 : undefined,
	// Reporter to use. See https://playwright.dev/docs/test-reporters
	// Configure projects for major browsers
	projects: [
		{
			name: 'accept-all-cmp',
			use: { ...devices['Desktop Chrome'] },
			testMatch: 'cmp-accept-all.setup.spec.ts',
			testDir: 'playwright/benchmark',
		},
		{
			name: 'reject-all-cmp',
			use: { ...devices['Desktop Chrome'] },
			testMatch: 'cmp-reject-all.setup.spec.ts',
			testDir: 'playwright/benchmark',
		},
		{
			name: 'consented',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'playwright/.auth/accept-all.json',
			},
			testMatch: 'test-ad-load-time.spec.ts',
			testDir: 'playwright/benchmark',
			dependencies: ['accept-all-cmp'],
		},
		{
			name: 'consentless',
			use: {
				...devices['Desktop Chrome'],
				storageState: 'playwright/.auth/reject-all.json',
			},
			testMatch: 'test-ad-load-time.spec.ts',
			testDir: './playwright/benchmark',

			dependencies: ['reject-all-cmp'],
		},
		{
			name: 'consented-average',
			use: {
				...devices['Desktop Chrome'],
			},
			testMatch: 'average.spec.ts',
			testDir: 'playwright/benchmark',
			dependencies: ['consented'],
		},
		{
			name: 'consentless-average',
			use: {
				...devices['Desktop Chrome'],
			},
			testMatch: 'average.spec.ts',
			testDir: 'playwright/benchmark',
			dependencies: ['consentless'],
		},
	],
});
