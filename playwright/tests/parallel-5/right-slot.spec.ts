import { breakpoints } from '@guardian/source-foundations';
import { test } from '@playwright/test';
import { allPages } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlotIframe } from '../../lib/util';

test.describe('right slot', () => {
	[...allPages].forEach(({ path }, index) => {
		test(`Test page ${index} has slot and iframe`, async ({ page }) => {
			// viewport width has to be >= 1300px for the right column to appear on liveblogs
			await page.setViewportSize({
				width: breakpoints['wide'],
				height: 200,
			});

			await loadPage(page, path);

			await cmpAcceptAll(page);

			// Check that the right ad slot is on the page
			await page.locator('#dfp-ad--right').isVisible();

			// creative isn't loaded unless slot is in view
			await page.locator('#dfp-ad--right').scrollIntoViewIfNeeded();

			// Check that an iframe is placed inside the ad slot
			await waitForSlotIframe(page, 'dfp-ad--right');
		});
	});
});
