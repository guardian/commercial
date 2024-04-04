import { expect, test } from '@playwright/test';
import { frontWithExclusion } from '../fixtures/pages/fronts';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

const { path } = frontWithExclusion;

test.describe('Exclusion targeting', () => {
	test(`Front targeted with exclusion line item should remove slots and containers`, async ({
		page,
	}) => {
		await loadPage(page, path);

		await cmpAcceptAll(page);

		expect(
			await page.locator('.top-banner-ad-container').isVisible(),
		).toBeFalsy();
	});
});
