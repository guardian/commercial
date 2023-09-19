import { test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { articles, blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlot } from '../../lib/util';

test.describe('merchandising high slot', () => {
	[...articles.slice(0, 3), ...blogs].forEach(({ path }, index) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			test(`Test page ${index} has slot and iframe at breakpoint ${breakpoint}`, async ({
				page,
			}) => {
				await page.setViewportSize({
					width,
					height,
				});

				await loadPage(page, path);
				await cmpAcceptAll(page);

				await waitForSlot(page, 'merchandising-high');
			});
		});
	});
});
