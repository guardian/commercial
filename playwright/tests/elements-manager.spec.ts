import { test } from '@playwright/test';
import lineItemFixture from '../../src/__fixtures__/line-items-fixtures.json';
import { articles } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { getStage, getTestUrl, waitForSlot } from '../lib/util';

test.describe('Elements manager', () => {
	test('GEM ad shows up', async ({ page }) => {
		if (articles[0]) {
			await page.route('https://adops-assets.s3.eu-west-1.amazonaws.com/elements-manager/line-items.json', async route => {
				await route.fulfill({ json: lineItemFixture });
			  });

			const path = getTestUrl({
				stage: getStage(),
				path: '/sport/2022/feb/10/team-gb-winter-olympic-struggles-go-on-with-problems-for-skeleton-crew?forcegem'
			})

			await loadPage(page, path);
			await cmpAcceptAll(page);

			await waitForSlot(page, 'merchandising');
		}
	})
});
