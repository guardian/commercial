import { expect, test } from '@playwright/test';
import type { PrebidAuctionInitEvent } from '../../src/lib/header-bidding/prebid-types';
import { articles } from '../fixtures/pages';
import { cmpAcceptAll } from '../lib/cmp';
import { loadPage } from '../lib/load-page';

const testPage = articles[0];

test.describe('Prebid', () => {
	test('should load the prebid script', async ({ page }) => {
		const scriptRequestPromise = page.waitForRequest(
			/.*\\graun\.Prebid\.js\.commercial\.js$/,
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
			{ timeout: 10000 },
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
		expect(bidders).toHaveLength(10);
		[
			'oxd',
			'and',
			'pubmatic',
			'ix',
			'adyoulike',
			'ozone',
			'xhb',
			'criteo',
			'ttd',
			'rubicon',
		].forEach((bidder) => {
			expect(bidders).toContain(bidder);
		});
	});
});
