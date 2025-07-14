import { expect, test } from '@playwright/test';
import { allPages } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('top-above-nav slot', () => {
	[...allPages].forEach(({ path }, index) => {
		test(`Test page ${index} has slot and iframe`, async ({ page }) => {
			await loadPage(page, path);

			await cmpAcceptAll(page);

			const isImmersive = await page.evaluate<boolean>(
				'window.guardian.config.page.isImmersive',
			);

			if (!isImmersive) {
				await waitForSlot(page, 'top-above-nav');
			} else {
				expect(
					await page.locator('#dfp-ad--top-above-nav').isVisible(),
				).toBeFalsy();
			}
		});
	});
});
