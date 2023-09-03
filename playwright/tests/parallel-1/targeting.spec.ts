import { expect, Page, Request, test } from '@playwright/test';
import { allPages, articles } from '../../fixtures/pages';
import { acceptAll } from '../../lib/cmp';
import { loadPage } from '../../lib/load-page';
import { bidderURLs, wins } from '../../fixtures/prebid';

const gamUrl = /https:\/\/securepubads.g.doubleclick.net\/gampad\/ads/;

const getEncodedParamsFromRequest = (
	request: Request,
	paramName: string,
): URLSearchParams | null => {
	const url = new URL(request.url());
	const param = url.searchParams.get(paramName);
	if (!param) return null;
	const paramDecoded = decodeURIComponent(param);
	const searchParams = new URLSearchParams(paramDecoded);
	return searchParams;
};

const waitForGAMRequestForSlot = (page: Page, slotExpected: string) => {
	return page.waitForRequest((request) => {
		const isURL = request.url().match(gamUrl);
		if (!isURL) return false;
		const searchParams = getEncodedParamsFromRequest(request, 'prev_scp');
		if (searchParams === null) return false;
		const slot = searchParams.get('slot');
		if (slot !== slotExpected) return false;
		console.log('found request for slot:', slotExpected);
		return true;
	});
};

const assertRequestParameter = (
	request: Request,
	name: string,
	matcher: (value: string) => boolean,
	isEncoded: boolean = false,
	encodedParam: string = '',
): boolean => {
	const url = new URL(request.url());
	let params: URLSearchParams | null = url.searchParams;
	if (isEncoded) {
		params = getEncodedParamsFromRequest(request, encodedParam);
	}
	if (params === null) return false;
	const paramValue = params.get(name);
	if (paramValue === null) return false;
	return matcher(paramValue);
};

test.describe('GAM targeting', () => {
	test('checks that a request is made', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		await gamRequestPromise;
	});

	test('checks the gdpr_consent param', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		const request = await gamRequestPromise;
		const matched = assertRequestParameter(
			request,
			'gdpr_consent',
			(value) => value.length > 0,
		);
		expect(matched).toBeTruthy();
	});

	test(`checks sensitive content is marked as sensitive`, async ({
		page,
	}) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		const sensitivePage = allPages.find(
			(page) => page?.name === 'sensitive-content',
		);
		if (!sensitivePage) {
			throw new Error('No sensitive articles found to run test.');
		}
		await loadPage(page, sensitivePage.path);
		await acceptAll(page);
		const request = await gamRequestPromise;
		const matched = assertRequestParameter(
			request,
			'sens',
			(value) => value === 't',
			true,
			'cust_params',
		);
		expect(matched).toBeTruthy();
	});
});

test.describe('Prebid targeting', () => {
	test.beforeEach(async ({ page }) => {
		page.route(bidderURLs.criteo, async (route) => {
			const url = route.request().url();
			if (url.includes(wins.criteo.url)) {
				console.log('replying with criteo response for: ', url);
				route.fulfill({
					body: JSON.stringify(wins.criteo.response),
				});
			}
		});
	});

	test(`criteo targeting`, async ({ page }) => {
		const gamCriteoRequestPromise = page.waitForRequest((request) => {
			const isURL = request.url().match(gamUrl);
			if (!isURL) return false;
			const isCriteoBid = request.url().includes('hb_bidder%3Dcriteo');
			if (!isCriteoBid) return false;
			console.log('matched gam criteo request:', request.url());
			return true;
		});
		const assertGamCriteoRequest = (request: Request) => {
			const prevScpParams = getEncodedParamsFromRequest(
				request,
				'prev_scp',
			);
			if (!prevScpParams) return false;
			console.log('prevScpParams', prevScpParams);
			const allMatched = Object.entries(wins.criteo.targeting).every(
				([key, value]) => {
					console.log(
						`checking ${key}: ${value} == ${prevScpParams.get(
							key,
						)}`,
					);
					if (prevScpParams.get(key) !== value) return false;
					return true;
				},
			);
			console.log('allMatched', allMatched);
			expect(allMatched).toBeTruthy();
		};
		await loadPage(page, articles[0].path);
		await acceptAll(page);
		const gamCriteoRequest = await gamCriteoRequestPromise;
		assertGamCriteoRequest(gamCriteoRequest);
	});
});
