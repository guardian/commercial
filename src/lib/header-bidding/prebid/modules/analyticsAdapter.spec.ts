import * as guardianLibs from '@guardian/libs';
import { EVENTS } from 'prebid.js/src/constants.js';
import * as errorReporting from '../../../../lib/error/report-error';
import type { EventData } from '../../prebid-types';
import analyticsAdapter, { _ } from './analyticsAdapter';

const { createEvent, isPayloadValid, handlers } = _;

// Mock dependencies
jest.mock('prebid.js/libraries/analyticsAdapter/AnalyticsAdapter.js', () => ({
	__esModule: true,
	default: () => ({
		track: jest.fn(),
		enableAnalytics: jest.fn(),
	}),
}));

jest.mock('prebid.js/src/adapterManager.js', () => ({
	__esModule: true,
	default: {
		registerAnalyticsAdapter: jest.fn(),
	},
}));

jest.mock('prebid.js/src/ajax.js', () => ({
	__esModule: true,
	fetch: jest.fn().mockImplementation(() => Promise.resolve({ ok: true })),
}));

jest.mock('../../../../lib/error/report-error', () => ({
	__esModule: true,
	reportError: jest.fn(),
}));

jest.mock('@guardian/libs', () => ({
	__esModule: true,
	log: jest.fn(),
}));

describe('analyticsAdapter', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Reset adapter context
		analyticsAdapter.context = {
			url: 'http://test-url.com',
			pv: 'test-pv',
			auctionTimeStart: Date.now(),
		};
	});

	describe('getBidderCode', () => {
		test('returns bidderCode if not ozone', () => {
			const args = { bidderCode: 'appnexus' };
			expect(_.getBidderCode(args)).toBe('appnexus');
		});

		test('returns empty string if bidderCode is undefined', () => {
			const args = { bidderCode: undefined };
			expect(_.getBidderCode(args)).toBe('');
		});

		test('returns ozone-advertiser if ozone with matching adId', () => {
			const args = {
				bidderCode: 'ozone',
				adId: '123-0-0',
				adserverTargeting: {
					oz_appnexus_adId: '123-0-0',
				},
			};
			expect(_.getBidderCode(args)).toBe('ozone-appnexus');
		});

		test('returns ozone-winner if adId not matched but oz_winner exists', () => {
			const args = {
				bidderCode: 'ozone',
				adId: '456-0-0',
				adserverTargeting: {
					oz_appnexus_adId: '123-0-0',
					oz_winner: 'triplelift',
				},
			};
			expect(_.getBidderCode(args)).toBe('ozone-triplelift');
		});

		test('returns ozone-unknown if no matches', () => {
			const args = {
				bidderCode: 'ozone',
				adId: '456-0-0',
				adserverTargeting: {
					oz_appnexus_adId: '123-0-0',
				},
			};
			expect(_.getBidderCode(args)).toBe('ozone-unknown');
		});
	});

	describe('createEvent', () => {
		test('removes unknown keys, undefined and null values', () => {
			const event = {
				ev: 'init',
				sid: 'slotId',
				aid: null,
				value1: undefined,
				value2: null,
				value3: 'test',
			};

			expect(createEvent(event)).toEqual({
				ev: 'init',
				sid: 'slotId',
			});
		});
	});

	describe('isPayloadValid', () => {
		test('returns true for valid init event', () => {
			const events = [{ ev: 'init' }];
			expect(isPayloadValid(events)).toBe(true);
		});

		test('returns true for valid bidwon event', () => {
			const events = [{ ev: 'bidwon' }];
			expect(isPayloadValid(events)).toBe(true);
		});

		test('returns false for empty events', () => {
			const events: EventData[] = [];

			expect(isPayloadValid(events)).toBe(false);
		});

		test('returns false for invalid event type', () => {
			const events = [{ ev: 'unknown' }];
			expect(isPayloadValid(events)).toBe(false);
		});
	});

	describe('event handlers', () => {
		test('AUCTION_INIT handler returns correct event data', () => {
			const args = { auctionId: 'test-auction' };
			const handler = handlers[EVENTS.AUCTION_INIT];

			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
				{
					ev: 'init',
					aid: 'test-auction',
					st: expect.any(Number) as number,
				},
			]);
		});

		test('BID_REQUESTED handler returns events for each bid', () => {
			const args = {
				bidderCode: 'test-bidder',
				start: 123456,
				bids: [
					{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' },
					{ adUnitCode: 'ad-slot-2', bidId: 'bid-2' },
				],
			};

			const handler = handlers[EVENTS.BID_REQUESTED];
			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
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
			]);
		});

		test('BID_RESPONSE handler returns correct event data', () => {
			const args = {
				statusMessage: 'Bid available',
				bidderCode: 'test-bidder',
				requestId: 'req-123',
				adUnitCode: 'ad-slot-1',
				cpm: 1.5,
				pbCg: '1.50',
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
			};
			const handler = handlers[EVENTS.BID_RESPONSE];
			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
				{
					ev: 'response',
					n: 'test-bidder',
					bid: 'req-123',
					sid: 'ad-slot-1',
					cpm: 1.5,
					pb: '1.50',
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
			]);
		});

		test('NO_BID handler returns correct event data', () => {
			const args = {
				bidder: 'test-bidder',
				bidId: 'bid-123',
				adUnitCode: 'ad-slot-1',
				auctionId: 'auction-123',
			};
			const handler = handlers[EVENTS.NO_BID];
			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
				{
					ev: 'nobid',
					n: 'test-bidder',
					bid: 'bid-123',
					sid: 'ad-slot-1',
					aid: 'auction-123',
					ttr: expect.any(Number) as number,
				},
			]);
		});

		test('AUCTION_END handler returns correct event data', () => {
			const args = { auctionId: 'auction-123' };
			const handler = handlers[EVENTS.AUCTION_END];
			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
				{
					ev: 'end',
					aid: 'auction-123',
					ttr: expect.any(Number) as number,
				},
			]);
		});

		test('BID_WON handler returns correct event data', () => {
			const args = {
				auctionId: 'auction-123',
				requestId: 'req-123',
			};
			const handler = handlers[EVENTS.BID_WON];
			expect(handler).toBeDefined();
			// @ts-expect-error -- we've asserted that it's not undefined
			const result = handler(analyticsAdapter, args);
			expect(result).toEqual([
				{
					ev: 'bidwon',
					aid: 'auction-123',
					bid: 'req-123',
				},
			]);
		});
	});

	describe('track method', () => {
		test('reports error when context is missing', () => {
			analyticsAdapter.context = undefined;
			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: { auctionId: 'test-auction' },
			});

			expect(errorReporting.reportError).toHaveBeenCalledWith(
				expect.any(Error),
				'commercial',
				{},
				{
					eventType: EVENTS.AUCTION_INIT,
					args: { auctionId: 'test-auction' },
				},
			);
			expect(guardianLibs.log).toHaveBeenCalledWith(
				'commercial',
				'context is not defined, prebid event not be logged',
			);
		});

		test('processes AUCTION_INIT event and adds to queue', () => {
			const sendPayloadMock = jest
				.fn()
				.mockImplementation(() => Promise.resolve());

			analyticsAdapter.sendPayload = sendPayloadMock;

			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_INIT,
				args: { auctionId: 'test-auction' },
			});

			// Should not call sendPayload for AUCTION_INIT
			expect(analyticsAdapter.sendPayload).not.toHaveBeenCalled();

			sendPayloadMock.mockRestore();
		});

		test('processes AUCTION_END event and sends payload', () => {
			const sendPayloadMock = jest
				.fn()
				.mockImplementation(() => Promise.resolve());

			analyticsAdapter.sendPayload = sendPayloadMock;

			analyticsAdapter.track({
				eventType: EVENTS.BID_REQUESTED,
				args: {
					bidderCode: 'test-bidder',
					start: 123456,
					bids: [{ adUnitCode: 'ad-slot-1', bidId: 'bid-1' }],
				},
			});

			analyticsAdapter.track({
				eventType: EVENTS.AUCTION_END,
				args: { auctionId: 'test-auction' },
			});

			expect(analyticsAdapter.sendPayload).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					v: 9,
					pv: 'test-pv',
					hb_ev: expect.any(Array) as unknown[],
				}),
			);

			sendPayloadMock.mockRestore();
		});

		test('clears queue when processing BID_WON event', () => {
			const sendPayloadMock = jest
				.fn()
				.mockImplementation(() => Promise.resolve());

			analyticsAdapter.sendPayload = sendPayloadMock;

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

			expect(analyticsAdapter.sendPayload).toHaveBeenCalledWith(
				'http://test-url.com',
				expect.objectContaining({
					hb_ev: [
						{
							ev: 'bidwon',
							aid: 'test-auction',
							bid: 'req-123',
						},
					],
				}),
			);

			sendPayloadMock.mockRestore();
		});
	});

	describe('enableAnalytics', () => {
		test('sets context with provided config', () => {
			analyticsAdapter.context = undefined;
			analyticsAdapter.enableAnalytics({
				options: {
					url: 'http://test-url.com',
					pv: 'test-pv',
				},
			});

			expect(analyticsAdapter.context).toEqual({
				url: 'http://test-url.com',
				pv: 'test-pv',
			});
		});
	});
});
