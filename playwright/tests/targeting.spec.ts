import type { Request } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { allPages, articles } from '../fixtures/pages';
import type { GuPage } from '../fixtures/pages/Page';
import {
	bidderURLs,
	criteoMockBidResponse,
	criteoWinningBidTargeting,
} from '../fixtures/prebid';
import { cmpAcceptAll } from '../lib/cmp';
import {
	assertRequestParameter,
	gamUrl,
	getEncodedParamsFromRequest,
	waitForGAMRequestForSlot,
} from '../lib/gam';
import { loadPage } from '../lib/load-page';

const article = articles[0] as unknown as GuPage;

test.describe('GAM targeting', () => {
	test('checks that a request is made', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage(page, article.path);
		await cmpAcceptAll(page);
		await gamRequestPromise;
	});

	test('checks the gdpr_consent param', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage(page, article.path);
		await cmpAcceptAll(page);
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
			(page) => page.name === 'sensitive-content',
		);
		if (!sensitivePage) {
			throw new Error('No sensitive articles found to run test.');
		}
		await loadPage(page, sensitivePage.path);
		await cmpAcceptAll(page);
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

type CriteoRequestPostBody = {
	imp: Array<{
		id: string;
	}>;
};
test.describe('Prebid targeting', () => {
	test.beforeEach(async ({ page }) => {
		return page.route(`${bidderURLs.criteo}**`, (route) => {
			const url = route.request().url();
			if (url.includes(bidderURLs.criteo)) {
				// The mock bid reponse impid must match that sent in the request
				const postData = route.request().postData();
				const json = JSON.parse(
					postData?.toString() ?? '',
				) as CriteoRequestPostBody;
				const impId = json.imp[0]?.id as string;

				void route.fulfill({
					body: JSON.stringify(criteoMockBidResponse(impId)),
				});
			}
		});
	});

	const assertGamCriteoRequest = (request: Request) => {
		const prevScpParams = getEncodedParamsFromRequest(request, 'prev_scp');
		if (!prevScpParams) return false;
		const allMatched = Object.entries(criteoWinningBidTargeting).every(
			([key, value]) => {
				if (prevScpParams.get(key) !== value) return false;
				return true;
			},
		);
		expect(allMatched).toBeTruthy();
	};

	test(`criteo targeting`, async ({ page }) => {
		const gamCriteoRequestPromise = page.waitForRequest((request) => {
			const isURL = request.url().match(gamUrl);
			if (!isURL) return false;
			const isCriteoBid = request.url().includes('hb_bidder%3Dcriteo');
			if (!isCriteoBid) return false;
			return true;
		});
		await loadPage(page, article.path);
		await cmpAcceptAll(page);
		const gamCriteoRequest = await gamCriteoRequestPromise;
		assertGamCriteoRequest(gamCriteoRequest);
	});
});
