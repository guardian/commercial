import { Page, test } from '@playwright/test';
import { allPages, articles } from '../../fixtures/pages';
import { acceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { bidderURLs, wins } from '../../fixtures/prebid';

const gamUrl = /https:\/\/securepubads.g.doubleclick.net\/gampad\/ads/;

const assertGAMRequestParameter = ({
	page,
	parameter,
	matcher,
	isCustParam,
}: {
	page: Page;
	parameter: string;
	matcher: (value: string) => boolean;
	isCustParam: boolean;
}) => {
	return page.waitForRequest((request) => {
		const isURL = request.url().match(gamUrl);
		if (!isURL) return false;
		const url = new URL(request.url());
		let paramValue: string | null = '';
		if (isCustParam) {
			const custParams = url.searchParams.get('cust_params');
			if (!custParams) return false;
			const decodedCustParams = decodeURIComponent(custParams);
			paramValue = new URLSearchParams(decodedCustParams).get(parameter);
		} else {
			paramValue = url.searchParams.get(parameter);
		}
		if (paramValue === null) return false;
		return matcher(paramValue);
	});
};

test.describe('GAM targeting', () => {
	test('checks that a request is made', async ({ page }) => {
		const gamRequestPromise = page.waitForRequest(gamUrl);
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	test('checks the gdpr_consent param', async ({ page }) => {
		const gamRequestPromise = assertGAMRequestParameter({
			page,
			parameter: 'gdpr_consent',
			matcher: (value) => value.length > 0,
			isCustParam: false,
		});
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	test(`checks sensitive content is marked as sensitive`, async ({
		page,
	}) => {
		const gamRequestPromise = assertGAMRequestParameter({
			page,
			parameter: 'sens',
			matcher: (value) => value === 't',
			isCustParam: true,
		});
		const sensitivePage = allPages.find(
			(page) => page?.name === 'sensitive-content',
		);
		if (!sensitivePage)
			throw new Error('No sensitive articles found to run test.');

		await loadPage(page, sensitivePage.path);
		await acceptAll(page);
		await gamRequestPromise;
	});
});

// TODO this test has been migrated from cypress where it was skipped
// But it is flakey here as well as the hb_bidder is sometimes null
// I think there are multiple criteo and we need to select the right one
test.describe('Prebid targeting', () => {
	test.beforeEach(async ({ page }) => {
		bidderURLs.forEach((url) => {
			page.route(url, async (route) => {
				const request = route.request();
				if (request.url().includes(wins.criteo.url)) {
					console.log(
						'replying with criteo response!!!!!',
						' for ',
						request.url(),
					);
					route.fulfill({
						body: JSON.stringify(wins.criteo.response),
					});
				} else {
					route.fulfill({
						status: 204,
					});
				}
			});
		});
	});

	test(`criteo targeting`, async ({ page }) => {
		const gamRequestPromise = page.waitForRequest((request) => {
			const isURL = request.url().match(gamUrl);
			if (!isURL) return false;
			const url = new URL(request.url());
			const prevScp = url.searchParams.get('prev_scp');
			if (!prevScp) return false;
			const prevScpDecoded = decodeURIComponent(prevScp);
			const prevScpParams = new URLSearchParams(prevScpDecoded);
			if (!prevScpParams) return false;
			console.log('prevScpParams', prevScpParams);
			const hbBidder = prevScpParams.get('hb_bidder');
			console.log('hbBidder', hbBidder);
			if (hbBidder === 'criteo') {
				return Object.entries(wins.criteo.targeting).every(
					([key, value]) => {
						console.log(
							'checking',
							key,
							prevScpParams.get(key),
							value,
						);
						if (prevScpParams.get(key) !== value) return false;
					},
				);
			}
			return true;
		});
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});
});
