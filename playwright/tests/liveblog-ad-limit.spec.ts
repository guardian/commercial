import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { BreakpointSizes } from '../fixtures/breakpoints';
import { breakpoints } from '../fixtures/breakpoints';
import { blogs } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { countLiveblogInlineSlots } from '../lib/util';

/**
 * TODO serial e2e tests
 * - It would be good to see if these tests could be run in parallel in the future
 */
const pages = blogs.filter(({ name }) => name === 'under-ad-limit');

const desktopBreakpoint = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop',
)[0] as unknown as BreakpointSizes;

const MAX_AD_SLOTS = 8;

const addAndAwaitNewBlocks = async (page: Page, blockContent: string) => {
	// scroll to the top so we get a toast to click on
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.evaluate((blockContent) => {
		// @ts-expect-error -- browser land
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- browser land
		window.mockLiveUpdate({
			numNewBlocks: 10,
			html: `
				<p style="height:2000px;" class="pending block">${blockContent}</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
				<p style="height:2000px;" class="pending block">New block</p>
			`,
			mostRecentBlockId: 'abc',
		});
	}, blockContent);

	// click on the toast to insert and scroll to the new blocks
	await page.getByRole('button', { name: '10 new updates' }).click();

	// Here, we force the test to wait until the blocks are visible on the page before counting the ad slots
	const newBlock = page.getByText(blockContent).first();
	await expect(newBlock).toBeVisible();
};

test.describe('A minimum amount of ad slots load', () => {
	pages.forEach(({ path, expectedMinInlineSlotsOnDesktop }) => {
		/**
		 * First ensure that the we receive the expected initial amount of ad slots.
		 *
		 * Something out of the Commercial teams control may occur that can affect how many ad slots
		 * are initially inserted into the page, e.g. the line height of text content.
		 *
		 * It is important that the initial amount of ad slots on the page does not
		 * equal the maximum amount of ad slots for this test to have value
		 */
		test('Extra ads are inserted upon update, but only up to the limit', async ({
			page,
		}) => {
			await page.setViewportSize({
				width: desktopBreakpoint.width,
				height: desktopBreakpoint.height,
			});

			await loadPage(page, path);
			await cmpAcceptAll(page);

			const initialSlotCount = await countLiveblogInlineSlots(
				page,
				false,
			);
			expect(initialSlotCount).toEqual(expectedMinInlineSlotsOnDesktop);

			await addAndAwaitNewBlocks(page, 'First batch of inserted blocks');
			const slotCountAfterFirstInsert = await countLiveblogInlineSlots(
				page,
				false,
			);
			expect(slotCountAfterFirstInsert).toBeGreaterThan(initialSlotCount);
			expect(slotCountAfterFirstInsert).toEqual(MAX_AD_SLOTS);

			await addAndAwaitNewBlocks(page, 'Second batch of inserted blocks');
			const slotCountAfterSecondInsert = await countLiveblogInlineSlots(
				page,
				false,
			);
			expect(slotCountAfterSecondInsert).toEqual(MAX_AD_SLOTS);
		});
	});
});
