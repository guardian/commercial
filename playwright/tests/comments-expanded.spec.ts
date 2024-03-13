import { breakpoints } from '@guardian/source-foundations';
import { expect, test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import type { GuPage } from '../fixtures/pages/Page';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForIsland, waitForSlot } from '../lib/util';

const { path } = articles[6] as unknown as GuPage;

test.describe('desktop comments-expanded slot', () => {
	test(`Check that comments-expanded slot is added when comments are expanded on desktop`, async ({
		page,
	}) => {
		await page.setViewportSize({
			width: breakpoints['wide'],
			height: 800,
		});

		await loadPage(page, path);

		await cmpAcceptAll(page);

		await expect(
			page.locator('[data-testid=comment-counts]').nth(0),
		).toBeVisible({
			timeout: 10000,
		});

		// Click the comment count to expand the comments
		await page.locator('[data-testid=comment-counts]').click();

		await waitForIsland(page, 'DiscussionWeb');

		await waitForSlot(page, 'comments-expanded');
	});
});

test.describe('mobile comments-expanded slot', () => {
	test(`Check that comments-expanded slot is added when comments are expanded on mobile`, async ({
		page,
	}) => {
		await page.setViewportSize({
			width: breakpoints['mobile'],
			height: 800,
		});

		await loadPage(page, path);

		await cmpAcceptAll(page);

		await expect(
			page.locator('[data-testid=comment-counts]').nth(0),
		).toBeVisible({
			timeout: 10000,
		});

		// Click the comment count to expand the comments
		await page.locator('[data-testid=comment-counts]').click();

		await waitForIsland(page, 'DiscussionWeb');

		await waitForSlot(page, 'comments-expanded-1');
	});
});
