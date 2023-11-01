import { test } from '@playwright/test';
import { fronts, tagFronts } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlot } from '../../lib/util';

test.describe('Slots and iframes load on fronts pages', () => {
	fronts.forEach(({ path }) => {
		test(`fronts-banner ads are loaded on ${path}`, async ({ page }) => {
			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'fronts-banner-1');
		});
	});
});

test.describe('Slots and iframes load on tagged fronts pages', () => {
	tagFronts.forEach(({ path }) => {
		test(`fronts-banner ads are loaded on ${path}`, async ({ page }) => {
			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'fronts-banner-1');
		});
	});
});
