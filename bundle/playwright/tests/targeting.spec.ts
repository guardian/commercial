import type { Request } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { allPages, articles } from '../fixtures/pages';
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

const article = articles[0];

test.describe('GAM targeting', () => {
	test('checks that a request is made', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage({ page, path: article.path });
		await cmpAcceptAll(page);
		await gamRequestPromise;
	});

	test('checks the gdpr_consent param', async ({ page }) => {
		const gamRequestPromise = waitForGAMRequestForSlot(
			page,
			'top-above-nav',
		);
		await loadPage({ page, path: article.path });
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
			(page) => 'name' in page && page.name === 'sensitive-content',
		);
		if (!sensitivePage) {
			throw new Error('No sensitive articles found to run test.');
		}
		await loadPage({ page, path: sensitivePage.path });
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

	test('targeting parameters regression - compare with expected values', async ({
		page,
	}) => {
		let capturedRequest: Request | null = null;

		await page.route(gamUrl, (route) => {
			const request = route.request();
			if (!capturedRequest && request.url().includes('top-above-nav')) {
				capturedRequest = request;
			}
			void route.abort();
		});

		await loadPage({ page, path: article.path });
		await cmpAcceptAll(page);
		await page.waitForTimeout(3000);

		expect(capturedRequest).toBeTruthy();
		if (!capturedRequest) {
			throw new Error('GAM request was not captured');
		}

		const prevScpParams = getEncodedParamsFromRequest(
			capturedRequest,
			'prev_scp',
		);
		const custParams = getEncodedParamsFromRequest(
			capturedRequest,
			'cust_params',
		);

		const criticalSlotParams = {
			slot: 'top-above-nav',
			gpid: '/59666047/gu/politics/Article/top-above-nav',
			'slot-fabric': 'fabric1',
			teadsEligible: 'false',
		};

		const criticalPageParams = {
			ct: 'article',
			p: 'ng',
			su: '0',
			bp: 'desktop',
			edition: 'us',
			url: '/politics/2022/feb/10/keir-starmer-says-stop-the-war-coalition-gives-help-to-authoritarians-like-putin',
		};

		// Verify slot-level targeting (prev_scp)
		for (const [key, expectedValue] of Object.entries(criticalSlotParams)) {
			const actualValue = prevScpParams?.get(key);
			expect(actualValue, `Slot param '${key}' should match`).toBe(
				expectedValue,
			);
		}

		// Verify page-level targeting (cust_params)
		for (const [key, expectedValue] of Object.entries(criticalPageParams)) {
			const actualValue = custParams?.get(key);
			expect(actualValue, `Page param '${key}' should match`).toBe(
				expectedValue,
			);
		}

		// Log all parameters for manual comparison if needed
		console.log('\n========== Complete Targeting Comparison ==========');
		console.log('Slot-level (prev_scp):');
		for (const [key, value] of prevScpParams?.entries() ?? []) {
			console.log(`  ${key}: ${value}`);
		}
		console.log('\nPage-level (cust_params):');
		for (const [key, value] of custParams?.entries() ?? []) {
			console.log(`  ${key}: ${value}`);
		}
		console.log('===================================================\n');
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
		await loadPage({ page, path: article.path });
		await cmpAcceptAll(page);
		const gamCriteoRequest = await gamCriteoRequestPromise;
		assertGamCriteoRequest(gamCriteoRequest);
	});
});
