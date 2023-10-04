import { test } from '@playwright/test';
import { isDefined } from 'core/types';
import { breakpoints } from '../../fixtures/breakpoints';
import { articles, blogs } from '../../fixtures/pages';
import type { GuPage } from '../../fixtures/pages/Page';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { waitForSlot } from '../../lib/util';

const pages = [articles[0], blogs[0]].filter<GuPage>(isDefined);

test.describe('merchandising high slot', () => {
	pages.forEach(({ path }, index) => {
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
