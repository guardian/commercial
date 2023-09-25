import { test } from '@playwright/test';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { getStage, getTestUrl, waitForSlot } from '../../lib/util';

test.describe('shouldLoadGoogletagSwitch', () => {
	test('ad slot should be filled when switch is true', async ({ page }) => {
		// Construct a path that uses a fixture where the `shouldLoadGoogletag` switch is set to true
		const path = getTestUrl(
			getStage(),
			'uk',
			'front',
			undefined,
			'overwriteShouldLoadGoogletagTrue',
		);
		await loadPage(page, path);
		await cmpAcceptAll(page);
		await waitForSlot(page, 'top-above-nav');
	});

	test('ad slot should be filled when switch is false', async ({ page }) => {
		// Construct a path that uses a fixture where the `shouldLoadGoogletag` switch is set to false
		const path = getTestUrl(
			getStage(),
			'uk',
			'front',
			undefined,
			'overwriteShouldLoadGoogletagFalse',
		);
		await loadPage(page, path);
		await cmpAcceptAll(page);

		// top-above-nav is immediately visible
		await page.locator('#dfp-ad--top-above-nav').isVisible();

		// top-above-nav is removed from the page eventually
		// by the commercial runtime
		await page
			.locator('#dfp-ad--top-above-nav')
			.waitFor({ state: 'detached', timeout: 30000 });
	});
});
