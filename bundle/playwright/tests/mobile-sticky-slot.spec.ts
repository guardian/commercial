import { expect, test } from '@playwright/test';
import { testAtBreakpoints } from '../lib/breakpoints';
import { loadPage } from '../lib/load-page';
import { cmpAcceptAll } from '../lib/cmp';
import { articles } from '../fixtures/pages';
import { GuPage } from '../fixtures/pages/Page';

const { path } = articles[0] as unknown as GuPage;

testAtBreakpoints(['mobile']).forEach(({ breakpoint, width, height }) => {
	test(`mobile sticky responds to banner:close event at ${breakpoint}`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height });
		await loadPage({ page, path, region: 'US' });
		await cmpAcceptAll(page);
		await loadPage({
			page,
			path,
			region: 'US',
			queryParams: { adtest: 'mobileStickyTest' },
		});

		await page.evaluate(() => {
			document.dispatchEvent(new Event('banner:close'));
		});

		await expect(page.locator('#dfp-ad--mobile-sticky')).toBeVisible();
	});
});

testAtBreakpoints(['mobile']).forEach(({ breakpoint, width, height }) => {
	test(`mobile sticky responds to banner:none event at ${breakpoint}`, async ({
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

		await page.waitForTimeout(1000);
		await expect(page.locator('#dfp-ad--mobile-sticky')).toBeVisible();
	});
});
