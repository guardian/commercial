import { test } from '@playwright/test';
import { isDefined } from '../../src/lib/types';
import { articles, blogs } from '../fixtures/pages';
import { testAtBreakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForSlot } from '../lib/util';

const pages = [articles[0], blogs[0]].filter(isDefined);

test.describe('mostpop slot', () => {
	pages.forEach(({ path }, index) => {
		/**
		 * Since the introduction of non-house advertising in the merchandising slot,
		 * we now hide the most pop slot until the tablet breakpoint
		 */
		testAtBreakpoints(['tablet', 'desktop', 'wide']).forEach(
			({ breakpoint, width, height }) => {
				test(`Test page ${index} has slot and iframe at breakpoint ${breakpoint}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage({ page, path });
					await cmpAcceptAll(page);

					await waitForSlot(page, 'mostpop');
				});
			},
		);
	});
});
