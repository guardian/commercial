import { expect, test } from '@playwright/test';
import { testAtBreakpoints } from '../lib/breakpoints';
import { loadPage } from '../lib/load-page';
import { cmpAcceptAll } from '../lib/cmp';
import { articles } from '../fixtures/pages';
import { GuPage } from '../fixtures/pages/Page';

const { path } = articles[0] as unknown as GuPage;

test.describe('mobile-sticky', () => {
	testAtBreakpoints(['mobile']).forEach(({ width, height }) => {
		test(`mobile sticky ad waits for StickyBottomBanner to be dismissed before loading`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });

			await loadPage({
				page,
				path,
				region: 'US',
				queryParams: { 'force-banner': '', adtest: 'mobileStickyTest' },
			});
			await cmpAcceptAll(page);
			await page.reload();

			// Banner should be visible, ad slot should not exist
			await expect(
				page.locator('[name="StickyBottomBanner"] > *'),
			).toBeVisible();
			await expect(
				page.locator('#dfp-ad--mobile-sticky'),
			).not.toBeAttached();

			// Dismiss banner
			// TODO: These text selectors are fragile - consider adding data-testid
			// attributes if this test starts failing due to banner text changes
			await page.getByRole('button', { name: 'Collapse banner' }).click();
			await page.getByText('Maybe later').click();

			// Banner hidden, ad slot should now appear
			await expect(
				page.locator('[name="StickyBottomBanner"]'),
			).not.toBeVisible();
			await expect(page.locator('#dfp-ad--mobile-sticky')).toBeAttached();
		});

		test(`mobile sticky responds to banner:none event at mobile breakpoint`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await loadPage({
				page,
				path,
				region: 'US',
				queryParams: {
					adtest: 'mobileStickyTest',
				},
			});
			await cmpAcceptAll(page);

			await page.evaluate(() => {
				document.dispatchEvent(new Event('banner:none'));
			});

			await expect(page.locator('#dfp-ad--mobile-sticky')).toBeAttached();
		});

		test(`mobile sticky responds to banner:sign-in-gate event at mobile breakpoint`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await loadPage({
				page,
				path,
				region: 'US',
				queryParams: {
					adtest: 'mobileStickyTest',
				},
			});
			await cmpAcceptAll(page);

			await page.evaluate(() => {
				document.dispatchEvent(new Event('banner:sign-in-gate'));
			});

			await expect(page.locator('#dfp-ad--mobile-sticky')).toBeAttached();
		});
	});
});
