import { test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { allPages } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlotIframe } from '../../lib/util';

test.describe('top-above-nav slot', () => {
	[...allPages].forEach(({ path }, index) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			test(`Test page ${index} has slot and iframe at breakpoint ${breakpoint}`, async ({
				page,
			}) => {
				await page.setViewportSize({
					width,
					height,
				});

				await loadPage(page, path);

				await cmpAcceptAll(page);

				// Check that the ad slot is on the page
				await page.locator('#dfp-ad--mostpop').isVisible();

				// creative isn't loaded unless slot is in view
				await page.locator('#dfp-ad--mostpop').scrollIntoViewIfNeeded();

				// Check that an iframe is placed inside the ad slot
				await waitForSlotIframe(page, 'dfp-ad--mostpop');
			});
		});
	});
});
