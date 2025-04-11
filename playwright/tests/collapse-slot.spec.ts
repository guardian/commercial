import { expect, test } from '@playwright/test';
import { articleWithCollapsedSlots } from '../fixtures/pages/articles';
import { cmpAcceptAll } from '../lib/cmp';
import { assertHeader, waitForGAMResponseForSlot } from '../lib/gam';
import { loadPage } from '../lib/load-page';

const { path } = articleWithCollapsedSlots;

test.describe('Ad slot removal', () => {
	test(`Empty ad slots should be removed from the DOM`, async ({ page }) => {
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

		expect(
			await page.locator('.ad-slot-right').isVisible({
				timeout: 3000,
			}),
		).toBeFalsy();

		expect(
			await page.locator('.ad-slot-merchandising').isVisible({
				timeout: 3000,
			}),
		).toBeFalsy();
	});
});
