import { EventTimer } from './EventTimer';
import { trackEvent } from './GoogleAnalytics';

jest.mock('./GoogleAnalytics', () => ({
	trackEvent: jest.fn(),
}));

describe('EventTimer', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- delete performance to mock it as is readonly
	delete (window as any).performance;

	const performance = {
		now: jest.fn(),
		mark: jest.fn(),
		getEntriesByName: jest.fn().mockReturnValue([
			{
				duration: 1,
				entryType: 'mark',
				name: 'commercial event',
				startTime: 1,
			},
		]),
	};

	Object.defineProperty(window, 'performance', {
		configurable: true,
		enumerable: true,
		value: performance,
		writable: true,
	});

	beforeEach(() => {
		window.guardian = {
			config: {
				googleAnalytics: {
					trackers: {
						editorial: 'gaTrackerTest',
					},
				},
			},
		};

		EventTimer.init();
	});

	it('trigger first slotReady event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'inline1');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.first-slotReady'],
		]);

		expect(trackEvent).toHaveBeenCalledWith(
			'Commercial Events',
			'slotReady',
			'first-slotReady',
		);
	});

	it('trigger top-above-nav slotReady event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'top-above-nav');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.first-slotReady'],
			['gu.commercial.top-above-nav-slotReady'],
		]);

		expect((trackEvent as jest.Mock).mock.calls).toEqual([
			['Commercial Events', 'slotReady', 'first-slotReady'],
			['Commercial Events', 'slotReady', 'top-above-nav-slotReady'],
		]);
	});

	it('not trigger a GA event if not in GA config', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adOnPage', 'inline1');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.first-adOnPage'],
		]);
		expect(trackEvent).not.toHaveBeenCalled();
	});

	it('trigger commercial start page event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('commercialStart');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.commercialStart'],
		]);
		expect(trackEvent).toHaveBeenCalledWith(
			'Commercial Events',
			'commercialStart',
			'Commercial start parse time',
		);
	});

	it('trigger commercial end page event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('commercialEnd');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.commercialEnd'],
		]);
		expect(trackEvent).toHaveBeenCalledWith(
			'Commercial Events',
			'commercialEnd',
			'Commercial end parse time',
		);
	});
});
