import { breakpoints } from '@guardian/source-foundations';
import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { articles, blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlotIframe } from '../../lib/util';

test.describe('right slot', () => {
	const assertRightSlot = async (page: Page, path: string) => {
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
	};

	[...articles].forEach(({ path }, index) => {
		test(`Test article ${index} has slot and iframe`, async ({ page }) => {
			await assertRightSlot(page, path);
		});
	});

	[...blogs].forEach(({ path }, index) => {
		test(`Test blog ${index} has slot and iframe`, async ({ page }) => {
			await assertRightSlot(page, path);
		});
	});
});
