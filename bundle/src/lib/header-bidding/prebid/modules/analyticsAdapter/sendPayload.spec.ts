import { EVENTS } from 'prebid.js/dist/src/constants';
import { logEvents } from './utils';
import analyticsAdapter, { flushEventQueue } from '.';

jest.mock('prebid.js/dist/src/ajax', () => ({
	__esModule: true,
	fetch: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('./utils', () => ({
	__esModule: true,
	logEvents: jest.fn(),
	createPayload:
		jest.requireActual<typeof import('./utils')>('./utils').createPayload,
}));

describe('logging', () => {
	// const triggerAuctionInit = (auctionId = 'test-auction') => {
	// 	analyticsAdapter.track({
	// 		eventType: EVENTS.AUCTION_INIT,
	// 		args: { auctionId },
	// 	});
	// };

	const triggerAuctionEnd = (auctionId = 'test-auction') => {
		analyticsAdapter.track({
			eventType: EVENTS.AUCTION_END,
			args: { auctionId },
		});
	};

	beforeEach(() => {
		flushEventQueue();

		analyticsAdapter.context = {
			pv: 'test-pv',
			url: 'http://test-url.com',
		};
	});

	it('logs successful requests of any event', async () => {
		analyticsAdapter.track({
			eventType: EVENTS.NO_BID,
			args: {},
		});

		void triggerAuctionEnd();
		await jest.runAllTimersAsync();

		expect(logEvents).toHaveBeenCalledWith([
			{
				ev: 'nobid',
				ttr: expect.any(Number) as number,
			},
			{
				aid: 'test-auction',
				ev: 'end',
				ttr: expect.any(Number) as number,
			},
		]);
	});

	it('logs successful requests of "init" events', async () => {
		analyticsAdapter.track({
			eventType: EVENTS.AUCTION_INIT,
			args: {},
		});

		void triggerAuctionEnd();
		await jest.runAllTimersAsync();

		expect(logEvents).toHaveBeenCalledWith([
			{
				ev: 'init',
				st: expect.any(Number) as number,
			},
			{
				aid: 'test-auction',
				ev: 'end',
				ttr: expect.any(Number) as number,
			},
		]);
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

		expect(logEvents).toHaveBeenCalledWith([
			{
				ev: 'init',
				st: expect.any(Number) as number,
			},
			{
				ev: 'nobid',
				sid: 'ad-slot-1',
				ttr: expect.any(Number) as number,
			},
			{
				aid: 'test-auction',
				ev: 'end',
				ttr: expect.any(Number) as number,
			},
		]);
	});

	// logging for these events don't seem to be working
	// in original implementation. skipping for now
	it('logs successful requests of "bidwon" events with known bid id', async () => {
		analyticsAdapter.track({
			eventType: EVENTS.BID_WON,
			args: { requestId: '12345' },
		});
		await jest.runAllTimersAsync();

		expect(logEvents).toHaveBeenCalledWith([
			{
				ev: 'bidwon',
				bid: '12345',
				aid: undefined,
			},
		]);
	});
});
