import { clickAcceptAllCookies as cmpAcceptAll } from '@guardian/consent-management-platform';
import { breakpoints } from '@guardian/source-foundations';
import { test } from '@playwright/test';
import { allPages } from '../fixtures/pages';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('right slot', () => {
	[...allPages].forEach(({ path }, index) => {
		test(`Test page ${index} has slot and iframe`, async ({ page }) => {
			// viewport width has to be >= 1300px for the right column to appear on liveblogs
			await page.setViewportSize({
				width: breakpoints['wide'],
				height: 800,
			});

			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'right');
		});
	});
});
