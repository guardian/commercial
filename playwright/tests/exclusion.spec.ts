import { expect, test } from '@playwright/test';
import { frontWithExclusion } from '../fixtures/pages/fronts';
import { cmpAcceptAll } from '../lib/cmp';
import { assertHeader, waitForGAMResponseForSlot } from '../lib/gam';
import { loadPage } from '../lib/load-page';

const { path } = frontWithExclusion;

test.describe('Exclusion targeting', () => {
	test(`Front targeted with exclusion line item should remove slots and containers`, async ({
		page,
	}) => {
		const gamResponse = waitForGAMResponseForSlot(page, 'top-above-nav');

		await loadPage(page, path);

		await cmpAcceptAll(page);

		const response = await gamResponse;

		// check single request mode
		const matched = await assertHeader(
			response,
			'google-lineitem-id',
			(value) => value === '6694738482',
		);

		expect(matched).toBeTruthy();

		expect(
			await page.locator('.top-banner-ad-container').isVisible({
				timeout: 3000,
			}),
		).toBeFalsy();
	});
});
