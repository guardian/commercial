import { test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import { loadTimePages } from '../fixtures/pages/load-time-pages';
import type { GuPage } from '../fixtures/pages/Page';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

test(`Test how long top-above-nav takes to load`, async ({ page }) => {
	test.setTimeout(300000);

	// warm up step to accept all and set up network conditions

	const { path } = articles[0] as unknown as GuPage;

	await loadPage(page, path);

	const client = await page.context().newCDPSession(page);

	await client.send('Network.emulateNetworkConditions', {
		offline: false,
		downloadThroughput: 3000 * (1024 / 8),
		uploadThroughput: 1500 * (1024 / 8),
		latency: 150,
	});

	await page.setViewportSize({ width: 1400, height: 800 });

	await cmpAcceptAll(page);

	let totalAdRenderTime = 0;

	// now we loop through the 20 test articles to calculate the average ad render time

	for (const article of loadTimePages) {
		const { path } = article;

		const startRenderingTime = Date.now();

		await page.goto(path, {
			waitUntil: 'domcontentloaded',
			timeout: 0,
		});

		await waitForSlot(page, 'top-above-nav');

		const renderingTime = Date.now() - startRenderingTime;

		console.log(`Ad rendered in ${renderingTime} ms`);

		totalAdRenderTime += renderingTime;
	}

	console.log(
		`Average ad render time is ${
			totalAdRenderTime / loadTimePages.length
		} ms`,
	);
});
