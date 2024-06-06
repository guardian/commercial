import { existsSync, mkdirSync } from 'fs';
import { appendFile, readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { loadTimePages } from '../fixtures/pages/load-time-pages';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

const networkConditions = {
	offline: false,
	downloadThroughput: 5000 * (1024 / 8),
	uploadThroughput: 1500 * (1024 / 8),
	latency: 150,
};

const viewport = { width: 1400, height: 800 };

const interceptCommercial = (page: Page) =>
	page.route('**/commercial/**/*.js', async (route) => {
		const path = route.request().url().split('/').pop();
		if (!path) {
			return await route.fulfill({
				status: 404,
				body: 'Not found',
			});
		}
		const body = await readFile(
			resolve(`dist/bundle/prod/${path}`),
			'utf-8',
		);
		await route.fulfill({
			status: 200,
			body,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate',
			},
		});
	});

test.describe.configure({ mode: 'parallel' });

test.describe('Test how long top-above-nav takes to load', () => {
	for (let i = 0; i < 3; i++) {
		for (const article of loadTimePages) {
			test(`${article.path}`, async ({ page }, testInfo) => {
				await interceptCommercial(page);

				const client = await page.context().newCDPSession(page);

				await client.send(
					'Network.emulateNetworkConditions',
					networkConditions,
				);

				await page.setViewportSize(viewport);

				await loadPage(page, article.path);

				const startRenderingTime = Date.now();

				await waitForSlot(page, 'top-above-nav');

				const renderingTime = Date.now() - startRenderingTime;

				console.log(`Ad rendered in ${renderingTime} ms`);

				const file = resolve(
					__dirname,
					`../../benchmark-results/${testInfo.project.name}/ad-rendering-time-${testInfo.workerIndex}.txt`,
				);

				if (!existsSync(file)) {
					mkdirSync(
						resolve(
							__dirname,
							`../../benchmark-results/${testInfo.project.name}`,
						),
						{
							recursive: true,
						},
					);
				}

				await appendFile(file, String(renderingTime) + '\n');
			});
		}
	}
});
