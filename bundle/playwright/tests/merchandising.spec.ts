import { test } from '@playwright/test';
import { isDefined } from '../../src/lib/types';
import { articles, blogs } from '../fixtures/pages';
import { breakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

const pages = [articles[0], blogs[0]].filter(isDefined);

test.describe('merchandising slot', () => {
	pages.forEach(({ path }, index) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			test(`Test page ${index} has slot and iframe at breakpoint ${breakpoint}`, async ({
				page,
			}) => {
				await page.setViewportSize({
					width,
					height,
				});

				await loadPage({ page, path });
				await cmpAcceptAll(page);

				await waitForSlot(page, 'merchandising');
			});
		});
	});
});
