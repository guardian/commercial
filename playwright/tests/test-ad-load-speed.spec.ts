import { test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import { loadTimePages } from '../fixtures/pages/load-time-pages';
import type { GuPage } from '../fixtures/pages/Page';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test.describe('top-above-nav slot', () => {
	test(`Test page  has slot and iframe`, async ({ page }) => {
		const { path } = articles[0] as unknown as GuPage;

		await loadPage(page, path);

		const client = await page.context().newCDPSession(page);

		await client.send('Network.emulateNetworkConditions', {
			offline: false,
			downloadThroughput: 4000 * (1024 / 8),
			uploadThroughput: 2000 * (1024 / 8),
			latency: 150,
		});

		await page.setViewportSize({ width: 1400, height: 800 });

		await cmpAcceptAll(page);

		loadTimePages.forEach((article) => {
			async () => {
				const { path } = article;

				const startRenderingTime = Date.now();

				await loadPage(page, path);

				await waitForSlot(page, 'top-above-nav');

				const endRenderingTime = Date.now();

				console.log(
					`Ad rendered in ${
						endRenderingTime - startRenderingTime
					} ms`,
				);
			};
		});
	});
});
