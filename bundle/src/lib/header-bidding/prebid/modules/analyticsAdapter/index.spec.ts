import { log } from '@guardian/libs';
import type { AnalyticsConfig } from 'prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { EVENTS } from 'prebid.js/dist/src/constants';
import * as errorReporting from '../../../../error/report-error';
import { sendPayload } from './sendPayload';
import analyticsAdapter, { flushEventQueue } from '.';

// jest.mock('prebid.js/dist/libraries/analyticsAdapter/AnalyticsAdapter', () => ({
// 	__esModule: true,
// 	default: () => ({
// 		track: jest.fn(),
// 		enableAnalytics: jest.fn(),
// 	}),
// }));

const sendPayloadMock = sendPayload as jest.MockedFunction<typeof sendPayload>;

jest.mock('prebid.js/dist/src/adapterManager', () => ({
	__esModule: true,
	default: {
		registerAnalyticsAdapter: jest.fn(),
	},
}));

jest.mock('prebid.js/dist/src/ajax', () => ({
	__esModule: true,
	fetch: jest.fn().mockImplementation(() => Promise.resolve({ ok: true })),
}));

jest.mock('../../../../../lib/error/report-error', () => ({
	__esModule: true,
	reportError: jest.fn(),
}));

jest.mock('./sendPayload', () => ({
	__esModule: true,
	sendPayload: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@guardian/libs', () => ({
	__esModule: true,
	log: jest.fn(),
}));

describe('prebid analyticsAdapter', () => {
	const getPayload = () => {
		const calls = sendPayloadMock.mock.calls;
		if (!calls[0]) {
			throw new Error('sendPayload was not called');
		}
		return calls[0][1];
	};

	const triggerAuctionInit = (auctionId = 'test-auction') => {
		analyticsAdapter.track({
			eventType: EVENTS.AUCTION_INIT,
			args: { auctionId },
		});
	};

	const triggerAuctionEnd = (auctionId = 'test-auction') => {
		analyticsAdapter.track({
			eventType: EVENTS.AUCTION_END,
			args: { auctionId },
		});
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.resetModules();

		flushEventQueue();

		// // Reset adapter context
		analyticsAdapter.context = {
			url: 'http://test-url.com',
			pv: 'test-pv',
			auctionTimeStart: Date.now(),
		};
	});

	it('sets context with provided config', () => {
		const config: AnalyticsConfig<'generic'> = {
			provider: 'generic',
			options: {
				url: 'http://test-url-2.com',
				pv: 'test-pv',
				auctionStartTime: Date.now(),
			} as unknown as AnalyticsConfig<'generic'>['options'],
		};
		analyticsAdapter.context = undefined;
		analyticsAdapter.enableAnalytics(config);

		expect(analyticsAdapter.context).toEqual(config.options);
	});

	it('sends payload to specified URL', () => {
		void triggerAuctionEnd();

		expect(sendPayload).toHaveBeenCalledWith(
			'http://test-url.com',
			expect.any(Object),
		);
	});

	describe('lifecycle', () => {
		it('reports error when context is missing', () => {
			analyticsAdapter.context = undefined;
			void triggerAuctionEnd();

			expect(errorReporting.reportError).toHaveBeenCalledWith(
				expect.any(Error),
				'commercial',
				{},
				{
					eventType: EVENTS.AUCTION_END,
					args: { auctionId: 'test-auction' },
				},
			);
			expect(log).toHaveBeenCalledWith(
				'commercial',
				'context is not defined, prebid event not being logged',
				{
					eventType: EVENTS.AUCTION_END,
					args: { auctionId: 'test-auction' },
					pv: undefined,
					url: undefined,
				},
			);
		});

		it('processes AUCTION_INIT event and adds to queue', () => {
			triggerAuctionInit();
			expect(sendPayload).not.toHaveBeenCalled();
		});

		it('processes AUCTION_END event and sends payload', () => {
			triggerAuctionInit();
			analyticsAdapter.track({
				eventType: EVENTS.BID_REQUESTED,
				args: {
					bidderCode: 'test-bidder',
					auctionStart: 123456,
					bids: [{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' }],
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'init',
							aid: 'test-auction',
							st: expect.any(Number) as number,
						},
						{
							ev: 'request',
							n: 'test-bidder',
							sid: 'ad-slot-1',
							bid: 'bid-1',
							st: 123456,
						},
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
					],
				}),
			);
		});

		it('clears queue when processing BID_WON event', () => {
			// Add some events to the queue
			analyticsAdapter.track({
				eventType: EVENTS.BID_REQUESTED,
				args: {
					bidderCode: 'test-bidder',
					auctionStart: 123456,
					bids: [{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' }],
				},
			});

			// Process BID_WON should clear queue and add only the bid won event
			analyticsAdapter.track({
				eventType: EVENTS.BID_WON,
				args: { auctionId: 'test-auction', requestId: 'req-123' },
			});

			expect(sendPayload).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'bidwon',
							aid: 'test-auction',
							bid: 'req-123',
						},
					],
				}),
			);
		});
	});

	describe('events', () => {
		it('sends AUCTION_END event with correct data', () => {
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
					],
				}),
			);
		});

		it('sends AUCTION_INIT event with correct data', () => {
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: { auctionId: 'test-auction' },
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'init',
							aid: 'test-auction',
							st: expect.any(Number) as number,
						},
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
					],
				}),
			);
		});

		it('sends BID_REQUESTED event with events each bid', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_REQUESTED,
				args: {
					bidderCode: 'test-bidder',
					auctionStart: 123456,
					bids: [
						{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' },
						{ adUnitCode: 'ad-slot-2', bidId: 'bid-2' },
					],
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'request',
							n: 'test-bidder',
							sid: 'ad-slot-1',
							bid: 'bid-1',
							st: 123456,
						},
						{
							ev: 'request',
							n: 'test-bidder',
							sid: 'ad-slot-2',
							bid: 'bid-2',
							st: 123456,
						},
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
					],
				}),
			);
		});

		it('sends BID_RESPONSE event with correct data', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: 'test-bidder',
					requestId: 'req-123',
					adUnitCode: 'ad-slot-1',
					cpm: 1.5,
					pbCg: 1.5,
					currency: 'USD',
					netRevenue: true,
					adId: 'ad-123',
					creativeId: 'creative-123',
					size: '300x250',
					timeToRespond: 150,
					dealId: 'deal-123',
					meta: {
						networkId: 'network-123',
						buyerId: 'buyer-123',
						brandId: 'brand-123',
						brandName: 'Brand Name',
						clickUrl: 'http://example.com',
					},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'response',
							n: 'test-bidder',
							bid: 'req-123',
							sid: 'ad-slot-1',
							cpm: 1.5,
							pb: 1.5,
							cry: 'USD',
							net: true,
							did: 'ad-123',
							cid: 'creative-123',
							sz: '300x250',
							ttr: 150,
							lid: 'deal-123',
							dsp: 'network-123',
							adv: 'buyer-123',
							bri: 'brand-123',
							brn: 'Brand Name',
							add: 'http://example.com',
						},
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
					],
				}),
			);
		});

		it('sends BID_WON event with correct data', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_WON,
				args: {
					auctionId: 'auction-123',
					requestId: 'req-123',
				},
			});

			expect(sendPayload).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'bidwon',
							aid: 'auction-123',
							bid: 'req-123',
						},
					],
				}),
			);
		});

		it('sends NO_BID event with correct data', () => {
			analyticsAdapter.track({
				eventType: EVENTS.NO_BID,
				args: {
					bidder: 'test-bidder',
					bidId: 'bid-123',
					adUnitCode: 'ad-slot-1',
					auctionId: 'auction-123',
					meta: {},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'nobid',
							n: 'test-bidder',
							bid: 'bid-123',
							sid: 'ad-slot-1',
							aid: 'auction-123',
							ttr: expect.any(Number) as number,
						},
						expect.objectContaining({
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						} as unknown),
					],
				}),
			);
		});
	});

	describe('bidder code submission', () => {
		it('sends empty bidderCode if not provided', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: undefined,
					meta: {},
				},
			});
			void triggerAuctionEnd();
			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- testing only one object
					hb_ev: expect.arrayContaining([
						expect.objectContaining({
							n: '',
						}),
					]),
				}),
			);
		});

		it('sends provided bidderCode if not ozone', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: 'appnexus',
					meta: {},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- testing only one object
					hb_ev: expect.arrayContaining([
						expect.objectContaining({
							n: 'appnexus',
						}),
					]),
				}),
			);
		});

		it('sends ozone-advertiser if ozone has matching adId', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: 'ozone',
					adId: '123-0-0',
					adserverTargeting: {
						oz_appnexus_adId: '123-0-0',
					},
					meta: {},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- testing only one object
					hb_ev: expect.arrayContaining([
						expect.objectContaining({
							n: 'ozone-appnexus',
						}),
					]),
				}),
			);
		});

		it('sends ozone-advertiser if ozone has matching adId', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: 'ozone',
					adId: '456-0-0',
					adserverTargeting: {
						oz_appnexus_adId: '123-0-0',
						oz_winner: 'triplelift',
					},
					meta: {},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- testing only one object
					hb_ev: expect.arrayContaining([
						expect.objectContaining({
							n: 'ozone-triplelift',
						}),
					]),
				}),
			);
		});

		it('returns ozone-unknown if no matches', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_RESPONSE,
				args: {
					statusMessage: 'Bid available',
					bidderCode: 'ozone',
					adId: '456-0-0',
					adserverTargeting: {
						oz_appnexus_adId: '123-0-0',
					},
					meta: {},
				},
			});
			void triggerAuctionEnd();

			expect(getPayload()).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',

					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- testing only one object
					hb_ev: expect.arrayContaining([
						expect.objectContaining({
							n: 'ozone-unknown',
						}),
					]),
				}),
			);
		});
	});
});
