import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { blogs } from '../fixtures/pages';
import type { BreakpointSizes } from '../lib/breakpoints';
import { breakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { expectLocatorToBeVisible } from '../lib/locators';

const pages = blogs.filter(
	(blog) => 'name' in blog && blog.name === 'under-ad-limit',
);

const desktopBreakpoint = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop',
)[0] as unknown as BreakpointSizes;

const MAX_AD_SLOTS = 8;

const addAndAwaitNewBlocks = async (page: Page, batch: number) => {
	// scroll to the top so we get a toast to click on
	await page.evaluate(() => window.scrollTo(0, 0));
	// @ts-expect-error -- browser land
	await page.waitForFunction(() => window.mockLiveUpdate !== undefined);
	await page.evaluate((batch) => {
		// @ts-expect-error -- browser land
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- browser land
		window.mockLiveUpdate({
			numNewBlocks: 10,
			html: `
				<p style="height:2000px;" >Batch ${batch} of inserted blocks</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.1</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.2</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.3</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.4</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.5</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.6</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.7</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.8</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.9</p>
				<p style="height:2000px;" class="pending block">New block ${batch}.10</p>
			`,
			mostRecentBlockId: 'abc',
		});
	}, batch);

	// click on the toast to insert and scroll to the new blocks
	await page.getByRole('button', { name: '10 new updates' }).click();

	// Here, we force the test to wait until the pending blocks are visible on the page before counting the ad slots
	const newBlock = page.getByText(`New block ${batch}.10`);
	await expectLocatorToBeVisible(newBlock);
};

test.describe('A minimum amount of ad slots load', () => {
	pages.forEach(({ path, expectedMinInlineSlots }) => {
		/**
		 * First ensure that the we receive the expected initial amount of ad slots.
		 *
		 * Something out of the Commercial teams control may occur that can affect how many ad slots
		 * are initially inserted into the page, e.g. the line height of text content.
		 *
		 * It is important that the initial amount of ad slots on the page does not
		 * equal the maximum amount of ad slots for this test to have value
		 */
		test('Extra ads are inserted upon update, but only up to the max limit', async ({
			page,
		}) => {
			const inlineSlotsSelector = `#liveblog-body .ad-slot--liveblog-inline`;

			await page.setViewportSize({
				width: desktopBreakpoint.width,
				height: desktopBreakpoint.height,
			});

			await loadPage({ page, path, queryParams: { live: 'true' } });
			await cmpAcceptAll(page);

			await expect(page.locator(inlineSlotsSelector)).toHaveCount(
				expectedMinInlineSlots.desktop,
				{
					timeout: 10000,
				},
			);

			await addAndAwaitNewBlocks(page, 1);

			await expect(page.locator(inlineSlotsSelector)).toHaveCount(
				MAX_AD_SLOTS,
				{
					timeout: 10000,
				},
			);

			await addAndAwaitNewBlocks(page, 2);

			await expect(page.locator(inlineSlotsSelector)).toHaveCount(
				MAX_AD_SLOTS,
				{
					timeout: 10000,
				},
			);
		});
	});
});
