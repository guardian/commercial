import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { frontWithPageSkin } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { assertHeader, waitForGAMResponseForSlot } from '../../lib/gam';
import { loadPage } from '../../lib/load-page';
import { waitForSlotIframe } from '../../lib/util';

const large = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop' || breakpoint === 'wide',
);

const small = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'mobile' || breakpoint === 'tablet',
);

test.describe('pageskin on uk front', () => {
	large.forEach(({ breakpoint, width, height }) => {
		test(`Test pageskin front on ${breakpoint} should display the pageskin background and use single request mode`, async ({
			page,
		}: {
			page: Page;
		}) => {
			await page.setViewportSize({
				width,
				height,
			});

			const gamResponsePromise = waitForGAMResponseForSlot(
				page,
				'top-above-nav',
			);
			await loadPage(page, frontWithPageSkin.path);
			await cmpAcceptAll(page);
			const response = await gamResponsePromise;
			const matched = await assertHeader(
				response,
				'google-lineitem-id',
				(value) => value.split(',').length > 1,
			);
			expect(matched).toBeTruthy();

			await expect(page.locator('body')).toHaveClass(/has-page-skin/);
			await expect(page.locator('body')).toHaveCSS(
				'background-image',
				/puppies-pageskin\.jpg/,
			);
		});
	});

	small.forEach(({ breakpoint, width, height }) => {
		test(`Test pageskin front on ${breakpoint} should NOT display the pageskin and NOT use single request mode`, async ({
			page,
		}: {
			page: Page;
		}) => {
			await page.setViewportSize({
				width,
				height,
			});

			const slot = 'top-above-nav';
			const slotWithPostfix =
				breakpoint === 'mobile' ? `${slot}--mobile` : slot;
			const slotId = `#dfp-ad--${slotWithPostfix}`;

			// the request to GAM uses the slot name of 'top-above-nav' for mobile and tablet
			const gamResponsePromise = waitForGAMResponseForSlot(page, slot);
			await loadPage(page, frontWithPageSkin.path);
			await cmpAcceptAll(page);

			// Check the ad slot is on the page
			await page.locator(slotId).isVisible();

			// creative isn't loaded unless slot is in view
			await page
				.locator(slotId)
				.scrollIntoViewIfNeeded({ timeout: 30000 });

			// Check that an iframe is placed inside the ad slot
			await waitForSlotIframe(page, `dfp-ad--${slotWithPostfix}`);

			const response = await gamResponsePromise;
			const matched = await assertHeader(
				response,
				'google-lineitem-id',
				(value) => value.split(',').length === 1,
			);
			expect(matched).toBeTruthy();

			await expect(page.locator('body')).toHaveClass('has-page-skin');
			await expect(page.locator('body')).not.toHaveCSS(
				'background-image',
				/puppies-pageskin\.jpg/,
			);
		});
	});
});
