import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { BreakpointSizes } from '../../fixtures/breakpoints';
import { breakpoints } from '../../fixtures/breakpoints';
import { blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';

/**
 * TODO serial e2e tests
 * - It would be good to see if these tests could be run in parallel in the future
 */

const pages = blogs.filter(({ name }) => name === 'ad-limit');

const desktopBreakpoint = breakpoints.filter(
	({ breakpoint }) => breakpoint === 'desktop',
)[0] as unknown as BreakpointSizes;

const maxAdSlots = 8;

const addAndAwaitNewBlocks = async (page: Page, blockContent: string) => {
	// scroll to the top so we get a toast to click on
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.evaluate((blockContent) => {
		// @ts-expect-error -- browser land
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- browser land
		window.mockLiveUpdate({
			numNewBlocks: 7,
			html: `
				<p style="height:1000px;" class="pending block">${blockContent}</p>
				<p style="height:1000px;" class="pending block">New block</p>
				<p style="height:1000px;" class="pending block">New block</p>
				<p style="height:1000px;" class="pending block">New block</p>
				<p style="height:1000px;" class="pending block">New block</p>
				<p style="height:1000px;" class="pending block">New block</p>
				<p style="height:1000px;" class="pending block">New block</p>
			`,
			mostRecentBlockId: 'abc',
		});
	}, blockContent);
	// click on the toast to insert and scroll to the new blocks
	await page.getByRole('button', { name: '7 new updates' }).click();

	// Here, we force the test to wait until the blocks are visible on the page before counting the ad slots
	const newBlock = page.getByText(blockContent).first();
	await expect(newBlock).toBeVisible();
};

const countInlineSlots = (page: Page) =>
	page.locator('#liveblog-body .ad-slot--liveblog-inline').count();

test.describe.serial('Ad slot limits', () => {
	pages.forEach(({ path, expectedMinInlineSlotsOnDesktop }) => {
		let page: Page;
		test.beforeAll(async ({ browser }) => {
			const context = await browser.newContext();
			page = await context.newPage();
			await page.setViewportSize({
				width: desktopBreakpoint.width,
				height: desktopBreakpoint.height,
			});

			await loadPage(page, path);
			await cmpAcceptAll(page);
		});

		test.afterAll(({ browser }) => {
			browser.close;
		});

		test('Initial slot count and first insertion', async () => {
			const initialSlotCount: number = await countInlineSlots(page);
			console.log(`initial slot count is ${initialSlotCount}`);
			expect(initialSlotCount).toEqual(expectedMinInlineSlotsOnDesktop);

			await addAndAwaitNewBlocks(page, 'First batch of inserted blocks');

			const afterFirstInsertSlotCount = await countInlineSlots(page);
			console.log(
				`slot count after first insertion is ${afterFirstInsertSlotCount}`,
			);
			expect(afterFirstInsertSlotCount).toBeGreaterThan(initialSlotCount);
		});

		test('Count slots after second insertion', async () => {
			await addAndAwaitNewBlocks(page, 'Second batch of inserted blocks');

			const afterSecondInsertSlotCount = await countInlineSlots(page);
			console.log(
				`slot count after second insertion is ${afterSecondInsertSlotCount}`,
			);
			expect(afterSecondInsertSlotCount).toEqual(maxAdSlots);
		});

		test('Count slots after third insertion', async () => {
			await addAndAwaitNewBlocks(page, 'Third batch of inserted blocks');

			const afterThirdInsertSlotCount = await countInlineSlots(page);
			console.log(
				`slot count after third insertion is ${afterThirdInsertSlotCount}`,
			);
			expect(afterThirdInsertSlotCount).toEqual(maxAdSlots);
		});
	});
});
