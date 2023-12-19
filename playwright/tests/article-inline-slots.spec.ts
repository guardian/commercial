import { expect, test } from '@playwright/test';
import { breakpoints } from '../fixtures/breakpoints';
import { articles } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

const pages = articles.filter(({ name }) => name === 'inlineSlots');

test.describe('Slots and iframes load on article pages', () => {
	pages.forEach(
		({
			path,
			expectedMinInlineSlotsOnDesktop,
			expectedMinInlineSlotsOnMobile,
		}) => {
			breakpoints.forEach(({ breakpoint, width, height }, index) => {
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

					// wait for Spacefinder to place the first inline slot into the DOM
					await page
						.locator('.ad-slot--inline1')
						.waitFor({ state: 'attached' });

					// wait for Spacefinder to run a second time, to place the inline2+ slots
					await page
						.locator('.ad-slot--inline2')
						.waitFor({ state: 'attached' });

					const foundSlots = await page
						.locator('.ad-slot--inline')
						.count();

					expect(foundSlots).toBeGreaterThanOrEqual(
						expectedMinSlotsOnPage,
					);
				});
			});
		},
	);
});
