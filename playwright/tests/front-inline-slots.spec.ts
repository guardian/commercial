import { test } from '@playwright/test';
import { fronts, tagPages } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('Slots and iframes load on fronts pages', () => {
	fronts.forEach(({ path }) => {
		test(`fronts-banner ads are loaded on ${path}`, async ({ page }) => {
			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'fronts-banner-1');
		});
	});
});

// currently no banners on tag fronts
test.skip('Slots and iframes load on tag pages', () => {
	tagPages.forEach(({ path }) => {
		test(`fronts-banner ads are loaded on ${path}`, async ({ page }) => {
			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'fronts-banner-1');
		});
	});
});
