import { expect, test } from '@playwright/test';
import { allPages } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlotIframe } from '../../lib/util';

test.describe('top-above-nav slot', () => {
	[...allPages].forEach(({ path }, index) => {
		test(`Test page ${index} has slot and iframe`, async ({ page }) => {
			await loadPage(page, path);

			await cmpAcceptAll(page);

			const isImmersive = await page.evaluate<boolean>(
				'window.guardian.config.page.isImmersive',
			);

			if (!isImmersive) {
				// Check the ad slot is on the page
				await page.locator('#dfp-ad--top-above-nav').isVisible();

				// creative isn't loaded unless slot is in view
				await page
					.locator('#dfp-ad--top-above-nav')
					.scrollIntoViewIfNeeded();

				// Check that an iframe is placed inside the ad slot
				await waitForSlotIframe(page, 'dfp-ad--top-above-nav');
			} else {
				expect(
					await page.locator('#dfp-ad--top-above-nav').isVisible(),
				).toBeFalsy();
			}
		});
	});
});
