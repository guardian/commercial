import { test } from '@playwright/test';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { getTestUrl, waitForSlot } from '../lib/util';

test.describe('shouldLoadGoogletagSwitch', () => {
	test('ad slot should be filled when switch is true', async ({ page }) => {
		const fixture = {
			config: {
				switches: {
					shouldLoadGoogletag: true,
				},
			},
		};
		const path = getTestUrl({
			path: 'uk',
			type: 'front',
			adtest: undefined,
		});
		await loadPage(page, path);
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
		const path = getTestUrl({
			path: 'uk',
			type: 'front',
			adtest: undefined,
		});
		await loadPage(page, path);
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
