import { clickAcceptAllCookies as cmpAcceptAll } from '@guardian/consent-management-platform';
import { expect, test } from '@playwright/test';
import { breakpoints } from '../fixtures/breakpoints';
import { blogs } from '../fixtures/pages';
import { loadPage } from '../lib/load-page';
import { countLiveblogInlineSlots } from '../lib/util';

/**
 * TODO serial e2e tests
 * - It would be good to see if these tests could be run in parallel in the future
 */

const pages = blogs.filter(({ name }) => name === 'live-update');

test.describe.serial('Liveblog live updates', () => {
	pages.forEach(({ path }) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			test(`Test ads are inserted when liveblogs update, breakpoint: ${breakpoint}`, async ({
				page,
			}) => {
				await page.setViewportSize({
					width,
					height,
				});

				await loadPage(page, path);
				await cmpAcceptAll(page);

				await page.evaluate(() => {
					// @ts-expect-error -- browser land
					window.guardian.commercial.dfpEnv.lazyLoadEnabled = false;
				});

				// Check that the first inline ad is in the DOM
				await page
					.locator('.ad-slot--inline1')
					.waitFor({ state: 'attached' });

				const isMobile = breakpoint === 'mobile';
				const startSlotCount = await countLiveblogInlineSlots(
					page,
					isMobile,
				);

				await page.evaluate(() => {
					// @ts-expect-error -- browser land
					// eslint-disable-next-line @typescript-eslint/no-unsafe-call -- browser land
					window.mockLiveUpdate({
						numNewBlocks: 5,
						html: `
								<p style="height:1000px;" class="pending block">New block</p>
								<p style="height:1000px;" class="pending block">New block</p>
								<p style="height:1000px;" class="pending block">New block</p>
								<p style="height:1000px;" class="pending block">New block</p>
								<p style="height:1000px;" class="pending block">New block</p>
							`,
						mostRecentBlockId: 'abc',
					});
				});

				// click the toast button to make the new blocks visible
				await page
					.getByRole('button', { name: '5 new updates' })
					.click();

				// new inline slot locator is the start slot count + 1
				// except mobile where top-above-nav is also an inline
				const newInlineSlotLocator = `#liveblog-body .ad-slot--inline${
					startSlotCount + (isMobile ? 0 : 1)
				}`;

				// wait for the first new inline slot
				await page
					.locator(newInlineSlotLocator)
					.waitFor({ state: 'attached' });

				const endSlotCount = await countLiveblogInlineSlots(
					page,
					isMobile,
				);

				expect(endSlotCount).toBeGreaterThan(startSlotCount);
			});
		});
	});
});
