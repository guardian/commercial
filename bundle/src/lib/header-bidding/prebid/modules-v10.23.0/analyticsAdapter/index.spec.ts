import { log } from '@guardian/libs';
import type { AnalyticsConfig } from 'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter';
import { EVENTS } from 'prebid-v10.23.0.js/dist/src/constants';
import * as errorReporting from '../../../../error/report-error';
import { type AnalyticsPayload } from './utils';
import analyticsAdapter from '.';

jest.mock(
	'prebid-v10.23.0.js/dist/libraries/analyticsAdapter/AnalyticsAdapter',
	() => ({
		__esModule: true,
		default: () => ({
			track: jest.fn(),
			enableAnalytics: jest.fn(),
		}),
	}),
);

jest.mock('prebid-v10.23.0.js/dist/src/adapterManager', () => ({
	__esModule: true,
	default: {
		registerAnalyticsAdapter: jest.fn(),
	},
}));

jest.mock('prebid-v10.23.0.js/dist/src/ajax', () => ({
	__esModule: true,
	fetch: jest.fn().mockImplementation(() => Promise.resolve({ ok: true })),
}));

jest.mock('@guardian/libs', () => ({
	__esModule: true,
	log: jest.fn(),
}));

jest.mock('../../../../../lib/error/report-error', () => ({
	__esModule: true,
	reportError: jest.fn(),
}));

describe('prebid analyticsAdapter', () => {
	let fetchMock: jest.Mock;

	const getFetchPayload = (): AnalyticsPayload => {
		const [, { body: fetchBody }] = fetchMock.mock.calls[0] as [
			string,
			{ body: string },
		];
		const fetchMockPayload = JSON.parse(fetchBody) as AnalyticsPayload;
		return fetchMockPayload;
	};

	const triggerAuctionEnd = () => {
		analyticsAdapter.track({
			eventType: EVENTS.AUCTION_END,
			args: { auctionId: 'test-auction' },
		});
	};

	beforeEach(async () => {
		jest.clearAllMocks();

		fetchMock = (await import('prebid-v10.23.0.js/dist/src/ajax'))
			.fetch as jest.Mock;

		// Reset adapter context
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
				url: 'http://test-url.com',
				pv: 'test-pv',
			} as unknown as AnalyticsConfig<'generic'>['options'],
		};
		analyticsAdapter.context = undefined;
		analyticsAdapter.enableAnalytics(config);

		expect(analyticsAdapter.context).toEqual(config.options);
	});

	it('sends payload to specified URL', () => {
		void triggerAuctionEnd();

		expect(fetchMock).toHaveBeenCalledWith('http://test-url.com', {
			method: 'POST',
			keepalive: true,
			body: JSON.stringify(getFetchPayload()),
			headers: {
				'Content-Type': 'application/json',
			},
		});
	});

	describe('lifecycle', () => {
		it('reports error when context is missing', () => {
			analyticsAdapter.context = undefined;
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_END,
				args: { auctionId: 'test-auction' },
			});

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
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: { auctionId: 'test-auction' },
			});
			expect(fetchMock).not.toHaveBeenCalled();
		});

		it('processes AUCTION_END event and sends payload', () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_REQUESTED,
				args: {
					bidderCode: 'test-bidder',
					start: 123456,
					bids: [{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' }],
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
				expect.objectContaining({
					v: 10,
					pv: 'test-pv',
					hb_ev: [
						{
							ev: 'end',
							aid: 'test-auction',
							ttr: expect.any(Number) as number,
						},
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
					start: 123456,
					bids: [{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' }],
				},
			});

			// Process BID_WON should clear queue and add only the bid won event
			analyticsAdapter.track({
				eventType: EVENTS.BID_WON,
				args: { auctionId: 'test-auction', requestId: 'req-123' },
			});

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					body: JSON.stringify({
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
				}),
			);
		});
	});

	describe('events', () => {
		it('sends AUCTION_END event with correct data', () => {
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
					start: 123456,
					bids: [
						{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' },
						{ adUnitCode: 'ad-slot-2', bidId: 'bid-2' },
					],
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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

			expect(fetchMock).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					body: JSON.stringify({
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
						expect.objectContaining({ ev: 'end' } as unknown),
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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
				},
			});
			void triggerAuctionEnd();

			const fetchMockPayload = getFetchPayload();
			expect(fetchMockPayload).toEqual(
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

	describe('logging', () => {
		it('logs successful requests of any event', async () => {
			analyticsAdapter.track({
				eventType: EVENTS.NO_BID,
				args: {},
			});

			void triggerAuctionEnd();
			await jest.runAllTimersAsync();

			expect(log).toHaveBeenCalledWith(
				'commercial',
				'prebid-v10.23.0.js events: ',
				expect.any(Array),
			);
		});

		it('logs successful requests of "init" events', async () => {
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: {},
			});

			void triggerAuctionEnd();
			await jest.runAllTimersAsync();

			expect(log).toHaveBeenCalledWith(
				'commercial',
				`prebid-v10.23.0.js events: bids for unknown slot`,
				[
					{
						ev: 'init',
						st: expect.any(Number) as number,
					},
					{
						aid: 'test-auction',
						ev: 'end',
						ttr: expect.any(Number) as number,
					},
				],
			);
		});

		it('logs successful requests of "init" events with known slotIds', async () => {
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: {},
			});
			analyticsAdapter.track({
				eventType: EVENTS.NO_BID,
				args: {
					adUnitCode: 'ad-slot-1',
				},
			});

			void triggerAuctionEnd();
			await jest.runAllTimersAsync();

			expect(log).toHaveBeenCalledWith(
				'commercial',
				`prebid-v10.23.0.js events: bids for ad-slot-1`,
				expect.any(Array),
			);
		});

		it('logs successful requests of "bidwon" events', async () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_WON,
				args: {},
			});
			await jest.runAllTimersAsync();

			expect(log).toHaveBeenCalledWith(
				'commercial',
				`prebid-v10.23.0.js events: bid won unknown bid`,
				[
					{
						ev: 'bidwon',
					},
				],
			);
		});

		// logging for these events don't seem to be working
		// in original implementation. skipping for now
		it('logs successful requests of "bidwon" events with known bid id', async () => {
			analyticsAdapter.track({
				eventType: EVENTS.BID_WON,
				args: { requestId: '12345' },
			});
			await jest.runAllTimersAsync();

			expect(log).toHaveBeenCalledWith(
				'commercial',
				`prebid-v10.23.0.js events: bid won 12345`,
				[
					{
						bid: '12345',
						ev: 'bidwon',
					},
				],
			);
		});
	});
});
