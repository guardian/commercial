import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { countLiveblogInlineSlots } from '../../lib/util';

const blogPages = blogs.filter(
	(page) =>
		'expectedMinInlineSlotsOnDesktop' in page &&
		'expectedMinInlineSlotsOnMobile' in page,
);

test.describe('A minimum number of ad slots load', () => {
	blogPages.forEach(
		({
			path,
			expectedMinInlineSlotsOnDesktop,
			expectedMinInlineSlotsOnMobile,
		}) => {
			breakpoints.forEach(({ breakpoint, width, height }) => {
				const isMobile = breakpoint === 'mobile';
				const expectedMinSlotsOnPage =
					(isMobile
						? expectedMinInlineSlotsOnMobile
						: expectedMinInlineSlotsOnDesktop) ?? 999;

				test(`There are at least ${expectedMinSlotsOnPage} inline total slots at breakpoint ${breakpoint}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage(page, path);
					await cmpAcceptAll(page);

					const foundSlots = await countLiveblogInlineSlots(
						page,
						isMobile,
					);

					expect(foundSlots).toBeGreaterThanOrEqual(
						expectedMinSlotsOnPage,
					);
				});
			});
		},
	);
});
