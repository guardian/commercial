import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { frontWithPageSkin } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { assertHeader, waitForGAMResponseForSlot } from '../../lib/gam';
import { loadPage } from '../../lib/load-page';
import { waitForSlot } from '../../lib/util';

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

			// check single request mode
			const matched = await assertHeader(
				response,
				'google-lineitem-id',
				(value) => value.split(',').length > 1,
			);
			expect(matched).toBeTruthy();

			// check page skin classes on body
			await expect(page.locator('body')).toHaveClass(/has-page-skin/);
			await expect(page.locator('body')).toHaveCSS(
				'background-image',
				/puppies-pageskin\.jpg/,
			);
		});
	});

	small.forEach(({ breakpoint, width, height }) => {
		if (breakpoint === 'tablet') {
			/**
			 * TODO e2e flakey test
			 * The test for tablet always passes locally but always fails on CI
			 */
			return;
		}
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

			// the request to GAM uses the slot name of 'top-above-nav' for mobile and tablet
			const gamResponsePromise = waitForGAMResponseForSlot(page, slot);
			await loadPage(page, frontWithPageSkin.path);
			await cmpAcceptAll(page);

			// need to wait for top-above-nav on mobile as it is out of view
			await waitForSlot(page, slotWithPostfix);

			const response = await gamResponsePromise;

			// check single request mode
			const matched = await assertHeader(
				response,
				'google-lineitem-id',
				(value) => value.split(',').length === 1,
			);
			expect(matched).toBeTruthy();

			// check page skin classes on body
			await expect(page.locator('body')).toHaveClass('has-page-skin');
			await expect(page.locator('body')).not.toHaveCSS(
				'background-image',
				/puppies-pageskin\.jpg/,
			);
		});
	});
});
