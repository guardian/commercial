import { clickAcceptAllCookies as cmpAcceptAll } from '@guardian/consent-management-platform';
import { expect, test } from '@playwright/test';
import { breakpoints } from '../fixtures/breakpoints';
import { blogs } from '../fixtures/pages';
import { loadPage } from '../lib/load-page';
import { countLiveblogInlineSlots } from '../lib/util';

const blogPages = blogs.filter(
	(page) =>
		'expectedMinInlineSlotsOnDesktop' in page &&
		'expectedMinInlineSlotsOnMobile' in page,
);

test.describe.serial('A minimum number of ad slots load', () => {
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

test.describe.serial('Correct set of slots are displayed', () => {
	const testBlogs = blogs.filter(({ name }) => name === 'under-ad-limit');

	const firstAdSlotSelectorDesktop = 'liveblog-inline--inline1';
	const firstAdSlotSelectorMobile = 'liveblog-inline-mobile--top-above-nav';

	testBlogs.forEach(({ path }) => {
		breakpoints
			.filter(({ breakpoint }) => breakpoint === 'mobile')
			.forEach(({ width, height }) => {
				test('on mobile, the mobile ad slots are displayed and desktop ad slots are hidden', async ({
					page,
				}) => {
					await page.setViewportSize({
						width,
						height,
					});

					await loadPage(page, path);
					await cmpAcceptAll(page);
					await loadPage(page, path);

					await page
						.getByTestId(firstAdSlotSelectorMobile)
						.scrollIntoViewIfNeeded();

					await expect(
						page.getByTestId(firstAdSlotSelectorMobile),
					).toBeVisible();

					await expect(
						page.getByTestId(firstAdSlotSelectorDesktop),
					).not.toBeVisible();
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

					await loadPage(page, path);
					await cmpAcceptAll(page);
					await loadPage(page, path);

					await page
						.getByTestId(firstAdSlotSelectorDesktop)
						.scrollIntoViewIfNeeded();

					await expect(
						page.getByTestId(firstAdSlotSelectorDesktop),
					).toBeVisible();

					await expect(
						page.getByTestId(firstAdSlotSelectorMobile),
					).not.toBeVisible();
				});
			});
	});
});
