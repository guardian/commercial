import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';

const pages = blogs.filter(({ name }) => name === 'ad-limit');

const desktopBreakpoint = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop',
)[0];

/**
 * TODO e2e flakey test
 * - sometimes window.mockLiveUpdate is not available because the article does not switch to 'live'
 * - sometimes the maxAdSlots is 7 and not 8
 */

const maxAdSlots = 8;

const addNewBlocks = async (page: Page) => {
	// scroll to the top so we get a toast to click on
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.evaluate(() => {
		// @ts-expect-error -- browser land
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- browser land
		window.mockLiveUpdate({
			numNewBlocks: 7,
			html: `
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
					<p style="height:1000px;" class="pending block">New block</p>
				`,
			mostRecentBlockId: 'abc',
		});
	});
	// click on the toast to insert and scroll to the new blocks
	await page.getByRole('button', { name: '7 new updates' }).click();
};

const countInlineSlots = (page: Page) =>
	page.locator('#liveblog-body .ad-slot--liveblog-inline').count();

test.describe('Ad slot limits', () => {
	pages.forEach(({ path, expectedMinInlineSlotsOnDesktop }) => {
		test(`doesn't insert more than ${maxAdSlots} ads on desktop`, async ({
			page,
		}) => {
			await page.setViewportSize({
				width: desktopBreakpoint.width,
				height: desktopBreakpoint.height,
			});

			await loadPage(page, path);
			await cmpAcceptAll(page);

			const initialSlotCount = await countInlineSlots(page);
			expect(initialSlotCount).toEqual(expectedMinInlineSlotsOnDesktop);

			// extra ad slots added after blocks inserted
			await addNewBlocks(page);
			const afterFirstInsertSlotCount = await countInlineSlots(page);
			expect(afterFirstInsertSlotCount).toBeGreaterThan(initialSlotCount);

			// no extra ad slots added after blocks inserted
			await addNewBlocks(page);
			const afterSecondInsertSlotCount = await countInlineSlots(page);
			expect(afterSecondInsertSlotCount).toEqual(maxAdSlots);

			// no extra ad slots added after blocks inserted
			await addNewBlocks(page);
			const afterThirdInsertSlotCount = await countInlineSlots(page);
			expect(afterThirdInsertSlotCount).toEqual(maxAdSlots);
		});
	});
});
