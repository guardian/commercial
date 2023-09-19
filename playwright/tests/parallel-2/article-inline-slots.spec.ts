import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { articles } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';

const pages = articles.filter(
	(page) =>
		'expectedMinInlineSlotsOnDesktop' in page &&
		'expectedMinInlineSlotsOnMobile' in page,
);

test.describe('Slots and iframes load on article pages', () => {
	pages.forEach(
		({
			path,
			expectedMinInlineSlotsOnDesktop,
			expectedMinInlineSlotsOnMobile,
		}) => {
			breakpoints.forEach(({ breakpoint, width, height }, index) => {
				// little hack to set the min expected slots to a large number if either props are undefined
				const expectedMinSlotsOnPage =
					(breakpoint === 'mobile'
						? expectedMinInlineSlotsOnMobile
						: expectedMinInlineSlotsOnDesktop) ?? 999;

				test(`Test article ${index} has at least ${expectedMinSlotsOnPage} inline total slots at breakpoint ${breakpoint}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage(page, path);
					await cmpAcceptAll(page);

					await page
						.locator('.ad-slot--inline')
						.first()
						.waitFor({ state: 'hidden', timeout: 30000 });

					const foundSlots = await page
						.locator('.ad-slot--inline')
						.count();

					expect(foundSlots).toBeGreaterThanOrEqual(
						expectedMinSlotsOnPage,
					);

					// TODO check each iframe exists for the slots?
				});
			});
		},
	);
});
