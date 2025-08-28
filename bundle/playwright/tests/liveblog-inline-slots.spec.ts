import { expect, test } from '@playwright/test';
import { blogs } from '../fixtures/pages';
import { breakpoints, testAtBreakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { expectToBeVisible, expectToNotBeVisible } from '../lib/locators';
import { countLiveblogInlineSlots } from '../lib/util';

const blogPages = blogs.filter((page) => 'expectedMinInlineSlots' in page);

test.describe.serial('A minimum number of ad slots load', () => {
	blogPages.forEach(({ path, expectedMinInlineSlots }) => {
		testAtBreakpoints(['mobile', 'tablet', 'desktop']).forEach(
			({ breakpoint, width, height }) => {
				const isMobile = breakpoint === 'mobile';
				const expectedMinSlotsOnPage =
					expectedMinInlineSlots[breakpoint];

				test(`There are at least ${expectedMinSlotsOnPage} inline total slots at breakpoint ${breakpoint} on ${path}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage({
						page,
						path,
						queryParams: { live: 'true' },
					});
					await cmpAcceptAll(page);

					const foundSlots = await countLiveblogInlineSlots(
						page,
						isMobile,
					);

					expect(foundSlots).toBeGreaterThanOrEqual(
						expectedMinSlotsOnPage,
					);
				});
			},
		);
	});
});

test.describe.serial('Correct set of slots are displayed', () => {
	const testBlogs = blogs.filter(
		(blog) => 'name' in blog && blog.name === 'under-ad-limit',
	);

	const firstAdSlotSelectorDesktop = '[data-testid=liveblog-inline--inline1]';
	const firstAdSlotSelectorMobile =
		'[data-testid=liveblog-inline-mobile--top-above-nav]';

	testBlogs.forEach(({ path }) => {
		breakpoints
			.filter(({ breakpoint }) => breakpoint === 'mobile')
			.forEach(({ width, height }) => {
				test(`on mobile, the mobile ad slots are displayed and desktop ad slots are hidden on ${path}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage({
						page,
						path,
						queryParams: { live: 'true' },
					});
					await cmpAcceptAll(page);
					await loadPage({
						page,
						path,
						queryParams: { live: 'true' },
					});

					await page
						.locator(firstAdSlotSelectorMobile)
						.scrollIntoViewIfNeeded();

					await expectToBeVisible(page, firstAdSlotSelectorMobile);

					await expectToNotBeVisible(
						page,
						firstAdSlotSelectorDesktop,
					);
				});
			});
	});

	testBlogs.forEach(({ path }) => {
		breakpoints
			.filter(({ breakpoint }) => breakpoint !== 'mobile')
			.forEach(({ breakpoint, width, height }) => {
				test(`on ${breakpoint}, the desktop ad slots are displayed and the mobile ad slots are hidden on ${path}`, async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage({
						page,
						path,
						queryParams: { live: 'true' },
					});
					await cmpAcceptAll(page);
					await loadPage({
						page,
						path,
						queryParams: { live: 'true' },
					});

					await page
						.locator(firstAdSlotSelectorDesktop)
						.scrollIntoViewIfNeeded();

					await expectToBeVisible(page, firstAdSlotSelectorDesktop);

					await expectToNotBeVisible(page, firstAdSlotSelectorMobile);
				});
			});
	});
});
