import { test } from '@playwright/test';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('shouldLoadGoogletagSwitch', () => {
	test('ad slot should be filled when switch is true', async ({ page }) => {
		const fixture = {
			config: {
				switches: {
					shouldLoadGoogletag: true,
				},
			},
		};
		await loadPage({ page, path: '/Front/https://www.theguardian.com/uk' });
		await cmpAcceptAll(page);
		await waitForSlot(page, 'top-above-nav');
	});

	test('ad slot should be filled when switch is false', async ({ page }) => {
		const fixture = {
			config: {
				switches: {
					shouldLoadGoogletag: false,
				},
			},
		};
		await loadPage({ page, path: '/Front/https://www.theguardian.com/uk' });
		await cmpAcceptAll(page);

		// top-above-nav is immediately visible
		await page.locator('#dfp-ad--top-above-nav').isVisible();

		// top-above-nav is removed from the page eventually
		// by the commercial runtime
		await page
			.locator('#dfp-ad--top-above-nav')
			.waitFor({ state: 'detached' });
	});
});
