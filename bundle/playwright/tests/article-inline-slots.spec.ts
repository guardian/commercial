import { expect, test } from '@playwright/test';
import { articles } from '../fixtures/pages';
import { testAtBreakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

const pages = articles.filter(
	(article) => 'name' in article && article.name === 'inlineSlots',
);

test.describe('Slots and iframes load on article pages', () => {
	pages.forEach((article, index) => {
		testAtBreakpoints(['mobile', 'tablet', 'desktop']).forEach(
			({ breakpoint, width, height }) => {
				const expectedMinSlotsOnPage =
					'expectedMinInlineSlots' in article &&
					article.expectedMinInlineSlots[breakpoint];

				const expectedSlotPositionsForBreakpoint =
					'expectedSlotPositions' in article &&
					article.expectedSlotPositions[breakpoint];

				if (expectedMinSlotsOnPage) {
					test(`Test article ${index} has at least ${expectedMinSlotsOnPage} inline total slots at breakpoint ${breakpoint} on ${article.path}`, async ({
						page,
					}) => {
						await page.setViewportSize({
							width,
							height,
						});

						await loadPage({ page, path: article.path });
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
				} else if (expectedSlotPositionsForBreakpoint) {
					test(`Test article ${index} has slots at positions ${expectedSlotPositionsForBreakpoint.join(
						',',
					)} at breakpoint ${breakpoint} on ${article.path}`, async ({
						page,
					}) => {
						await page.setViewportSize({
							width,
							height,
						});

						await loadPage({ page, path: article.path });
						await cmpAcceptAll(page);

						await page
							.locator('.ad-slot--inline2')
							.waitFor({ state: 'attached' });

						const slotPositions = await page
							.locator('.article-body-commercial-selector')
							.evaluate((el) =>
								Array.from(el.children)
									.map((child, index) =>
										child.classList.contains(
											'ad-slot-container',
										)
											? index
											: undefined,
									)
									.filter((index) => index !== undefined),
							);

						expect(slotPositions).toEqual(
							expectedSlotPositionsForBreakpoint,
						);
					});
				}
			},
		);
	});
});
