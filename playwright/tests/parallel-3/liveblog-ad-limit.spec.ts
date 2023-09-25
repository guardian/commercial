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

// TODO the max on playwright is 7 not 8 - double check
const maxAdSlots = 7;

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
		test(`doesn't insert more than 7 ads on desktop`, async ({ page }) => {
			await page.setViewportSize({
				width: desktopBreakpoint.width,
				height: desktopBreakpoint.height,
			});

			await loadPage(page, path);
			await cmpAcceptAll(page);

			let inlineSlotCount = await countInlineSlots(page);
			expect(inlineSlotCount).toEqual(expectedMinInlineSlotsOnDesktop);

			await addNewBlocks(page);
			inlineSlotCount = await countInlineSlots(page);
			expect(inlineSlotCount).toEqual(maxAdSlots);

			await addNewBlocks(page);
			inlineSlotCount = await countInlineSlots(page);
			expect(inlineSlotCount).toEqual(maxAdSlots);
		});
	});
});
