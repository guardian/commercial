import { expect, test } from '@playwright/test';
import { testAtBreakpoints } from '../lib/breakpoints';
import { loadPage, LoadPageParams } from '../lib/load-page';
import { cmpAcceptAll } from '../lib/cmp';
import { articles } from '../fixtures/pages';
import { GuPage } from '../fixtures/pages/Page';

const { path } = articles[0] as unknown as GuPage;

const cmpSelector = 'iframe[id*="sp_message_iframe"]';
const bannerSelector = '[name="StickyBottomBanner"]';
const mobileStickySelector = '#dfp-ad--mobile-sticky';

test.describe('mobile-sticky', () => {
	testAtBreakpoints(['mobile']).forEach(({ width, height }) => {
		test(`should NOT render when the CMP is present on the page`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			const queryParams = {
				adtest: 'mobileStickyTest',
				'force-banner': '',
			};
			await loadPage({ page, path, region: 'US', queryParams });

			await expect(page.locator(cmpSelector)).toBeAttached();
			await expect(page.locator(mobileStickySelector)).not.toBeAttached();
		});

		(
			['US', 'AU', 'IE', 'CA'] satisfies Array<LoadPageParams['region']>
		).map((region) =>
			test(`should render on page after the CMP has been dismissed in geo ${region}`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height });
				const queryParams = {
					adtest: 'mobileStickyTest',
					'force-banner': '',
				};
				await loadPage({ page, path, region, queryParams });
				await cmpAcceptAll(page);

				await expect(page.locator(cmpSelector)).not.toBeAttached();
				await expect(page.locator(mobileStickySelector)).toBeAttached();
			}),
		);

		test(`should NOT render in GB region`, async ({ page }) => {
			await page.setViewportSize({ width, height });
			const queryParams = {
				adtest: 'mobileStickyTest',
				'force-banner': '',
			};
			await loadPage({ page, path, region: 'GB', queryParams });
			await cmpAcceptAll(page);

			await expect(page.locator(cmpSelector)).not.toBeAttached();
			await expect(page.locator(mobileStickySelector)).not.toBeAttached();
		});

		test(`should NOT render while reader revenue banner visible on page`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			const queryParams = {
				adtest: 'mobileStickyTest',
				'force-banner': '',
			};
			await loadPage({ page, path, region: 'US', queryParams });
			await cmpAcceptAll(page);
			await page.reload();

			// Banner should be visible, mobile sticky ad slot should not
			await expect(page.locator(bannerSelector)).toBeVisible();
			await expect(page.locator(mobileStickySelector)).not.toBeAttached();
		});

		test(`should render after reader revenue banner dismissed`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			const queryParams = {
				adtest: 'mobileStickyTest',
				'force-banner': '',
			};
			await loadPage({ page, path, region: 'US', queryParams });
			await cmpAcceptAll(page);
			await page.reload();

			// Dismiss banner
			// TODO: These text selectors are fragile - consider adding data-testid
			// attributes if this test starts failing due to banner text changes
			const twoStepBanner = page
				.getByRole('alert')
				.getByRole('button', { name: 'Collapse banner' });

			const oneStepBanner = page
				.getByRole('alert')
				.getByRole('button', { name: 'Close' });

			expect(twoStepBanner.or(oneStepBanner)).toBeVisible;

			if (await twoStepBanner.isVisible()) {
				await twoStepBanner.click();
				await page.getByText('Maybe later').click();
			} else {
				await oneStepBanner.click();
			}

			// Banner hidden, ad slot should now appear
			await expect(
				page.locator('[name="StickyBottomBanner"]'),
			).not.toBeVisible();
			await expect(page.locator(mobileStickySelector)).toBeAttached();
		});

		test(`should render when no banner is chosen to show`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await page.addInitScript(() => {
				// Prevent the support banner from showing
				window.localStorage.setItem(
					'gu.prefs.engagementBannerLastClosedAt',
					`{"value":"${new Date().toISOString()}"}`,
				);
				// Prevent the sign in gate from showing
				window.localStorage.setItem(
					'gu.prefs.sign-in-gate',
					'{"value":{"gate-dismissed-count-AuxiaSignInGate-default-treatment-id":5}}',
				);
			});
			const queryParams = {
				adtest: 'mobileStickyTest',
			};
			await loadPage({ page, path, region: 'US', queryParams });
			await cmpAcceptAll(page);
			await page.reload();

			await expect(page.locator(mobileStickySelector)).toBeAttached();
		});

		test(`should render when sign in gate is the chosen "banner"`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });

			await page.addInitScript(() => {
				// Prevent the support banner from showing
				window.localStorage.setItem(
					'gu.prefs.engagementBannerLastClosedAt',
					`{"value":"${new Date().toISOString()}"}`,
				);
			});
			await loadPage({ page, path, region: 'US' });
			await cmpAcceptAll(page);
			await page.reload();

			await expect(page.locator(mobileStickySelector)).toBeAttached();
		});
	});
});
