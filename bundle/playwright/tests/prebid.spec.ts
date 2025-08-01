import { expect, test } from '@playwright/test';
import type { PrebidAuctionInitEvent } from '../../src/lib/header-bidding/prebid-types';
import { articles } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';
import { getStage, headerBiddingAnalyticsUrl } from '../lib/util';

const testPage = articles[0];

test.describe('Prebid', () => {
	test('should load the prebid script', async ({ page }) => {
		const scriptRequestPromise = page.waitForRequest(
			/graun\.Prebid\.js\.commercial\.js$/,
		);
		await loadPage(page, testPage.path);
		await cmpAcceptAll(page);
		const prebid = await scriptRequestPromise;

		expect(prebid).toBeTruthy();
	});

	test('should request bids for top-above-nav', async ({ page }) => {
		await loadPage(page, testPage.path);

		await cmpAcceptAll(page);

		await page.waitForFunction(
			() => {
				const events = window.pbjs?.getEvents() ?? [];
				return events.find(
					(event) =>
						event.eventType === 'auctionInit' &&
						event.args.adUnitCodes.includes(
							'dfp-ad--top-above-nav',
						),
				);
			},
			{
				timeout: 10_000, // 10s
			},
		);

		const topAboveNavBidderRequests = await page.evaluate(() => {
			const auctionInitEvent = window.pbjs
				?.getEvents()
				.find(
					(event): event is PrebidAuctionInitEvent =>
						event.eventType === 'auctionInit' &&
						event.args.adUnitCodes.includes(
							'dfp-ad--top-above-nav',
						),
				);

			return auctionInitEvent?.args.bidderRequests;
		});

		const bidders = topAboveNavBidderRequests?.map(
			(request) => request.bidderCode,
		);

		expect(bidders).toBeTruthy();
		expect(bidders).toHaveLength(9);
		[
			'oxd',
			'and',
			'pubmatic',
			'ix',
			'ozone',
			'xhb',
			'criteo',
			'ttd',
			'rubicon',
		].forEach((bidder) => {
			expect(bidders).toContain(bidder);
		});
	});

	test('should not find bidderErrors (excluding timeouts)', async ({
		page,
	}) => {
		await loadPage(page, testPage.path);

		await cmpAcceptAll(page);

		await page.waitForFunction(
			() => {
				const events = window.pbjs?.getEvents() ?? [];
				return events.find((event) => event.eventType === 'auctionEnd');
			},
			{
				timeout: 10_000, // 10s
			},
		);

		const bidderErrors = await page.evaluate(() => {
			return window.pbjs
				?.getEvents()
				.filter(
					(event) =>
						event.eventType === 'bidderError' &&
						event.args.error.timedOut !== true,
				);
		});

		expect(bidderErrors).toHaveLength(0);
	});

	test('analytics should be called', async ({ page }) => {
		const stage = getStage();

		const analyticsEndpoint = headerBiddingAnalyticsUrl[stage];

		const analyticsRequestPromise = page.waitForRequest(analyticsEndpoint);

		await loadPage(page, testPage.path + '&pbjs-analytics=true');
		await cmpAcceptAll(page);

		// trigger pagehide event
		await page.evaluate(() => {
			const event = new Event('pagehide');
			window.dispatchEvent(event);
		});

		const analyticsRequest = await analyticsRequestPromise;

		expect(analyticsRequest).toBeTruthy();
		expect(analyticsRequest.postData()).toContain('"ev":"end"');
		expect(analyticsRequest.postData()).toContain('"ev":"nobid"');
		expect(analyticsRequest.postData()).toContain('"ev":"request"');
	});
});
