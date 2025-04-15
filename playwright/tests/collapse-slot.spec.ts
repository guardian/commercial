import { expect, test } from '@playwright/test';
import { articleWithCollapsedSlots } from '../fixtures/pages/articles';
import { cmpAcceptAll } from '../lib/cmp';
import { assertHeader, waitForGAMResponseForSlot } from '../lib/gam';
import { loadPage } from '../lib/load-page';

const { path } = articleWithCollapsedSlots;

test.describe('Ad slot removal', () => {
	test(`Empty ad slots should be removed from the DOM`, async ({
		page,
	}) => {
		const gamResponse = waitForGAMResponseForSlot(page, 'top-above-nav');

		await loadPage(page, path);

		await cmpAcceptAll(page);

		const response = await gamResponse;

		const matched = await assertHeader(
			response,
			'google-lineitem-id',
			(value) => value === '6966767669',
		);

		expect(matched).toBeTruthy();

		expect(
			await page.locator('.top-banner-ad-container').isVisible({
				timeout: 3000,
			}),
		).toBeFalsy();

		// The '..' selector selects the parent, in this case the <aside> tag wrapping the ad
		const topBannerBox = await page.locator('.top-banner-ad-container').locator('..').boundingBox({
			timeout: 3000,
		});

		expect(
			topBannerBox?.height
		).toEqual(0);

		expect(
			await page.locator('.ad-slot--right').isVisible({
				timeout: 3000,
			}),
		).toBeFalsy();

		const rightSlotBox = await page.locator('.ad-slot--right').locator('..').boundingBox({
			timeout: 3000,
		});

		expect(
			rightSlotBox?.height
		).toEqual(0);
	});
});
