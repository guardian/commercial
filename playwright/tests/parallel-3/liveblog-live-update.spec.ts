import { expect, test } from '@playwright/test';
import { breakpoints } from '../../fixtures/breakpoints';
import { blogs } from '../../fixtures/pages';
import { cmpAcceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';

const pages = blogs.filter(({ name }) => name === 'live-update');

test.describe('Liveblog live updates', () => {
	pages.forEach(({ path }) => {
		breakpoints.forEach(({ breakpoint, width, height }) => {
			test(`Test ads are inserted when liveblogs update, breakpoint: ${breakpoint}`, async ({
				page,
			}) => {
				const isMobile = breakpoint === 'mobile';

				await page.setViewportSize({
					width,
					height,
				});

				await loadPage(page, path);
				await cmpAcceptAll(page);

				// count the initial inline slots
				const startSlotCount = await page
					.locator('#liveblog-body .ad-slot--liveblog-inline')
					.count();

				console.log(`start slot count is ${startSlotCount}`);

				await page.evaluate(() => {
					// @ts-expect-error -- browser land
					window.guardian.commercial.dfpEnv.lazyLoadEnabled = false;
				});

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
					.scrollIntoViewIfNeeded();

				await page
					.locator(newInlineSlotLocator)
					.waitFor({ state: 'visible', timeout: 30000 });

				// count the inline slots
				const endSlotCount = await page
					.locator('#liveblog-body .ad-slot--liveblog-inline')
					.count();

				console.log(`expecting ${endSlotCount} > ${startSlotCount}`);

				expect(endSlotCount).toBeGreaterThan(startSlotCount);
			});
		});
	});
});
