import { expect, test } from '@playwright/test';
import { breakpoints } from '../lib/breakpoints';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { waitForIsland } from '../lib/util';

const url =
	'/Article/https://www.theguardian.com/football/2026/sep/06/exceptional-arteta-arsenal-fightback-win-chelsea';

/**
 * Within Spacefinder, we make an assumption on the height of the rich link images in
 * order to place adverts appropriately. If the display of rich link images changes,
 * we may need to revisit this assumption.
 */
test.describe('Rich links', () => {
	const expectedImageHeightsByBreakpoint = {
		mobile: 0,
		tablet: 112,
		desktop: 112,
		wide: 176,
	};

	breakpoints.forEach(({ breakpoint, width, height }) => {
		test(`Rich link has expected dimensions ${breakpoint}`, async ({
			page,
		}) => {
			await page.setViewportSize({
				width,
				height,
			});

			await loadPage({ page, path: url });
			await cmpAcceptAll(page);

			await waitForIsland(page, 'RichLinkComponent');

			const richLinkImage = page.getByAltText(
				'Martin Ødegaard (right) with Declan Rice',
			);

			const expectedImageHeight =
				expectedImageHeightsByBreakpoint[breakpoint];

			if (expectedImageHeight === 0) {
				await expect(richLinkImage).not.toBeVisible();
				return;
			}

			const boundingBox = await richLinkImage.boundingBox();

			expect(boundingBox?.height).toBe(expectedImageHeight);
		});
	});
});
