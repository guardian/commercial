import { EventTimer } from './EventTimer';
import { trackEvent } from './GoogleAnalytics';

jest.mock('./GoogleAnalytics', () => ({
	trackEvent: jest.fn(),
}));

const mockGetEntriesByName = (names: string[]) =>
	jest.fn((name) =>
		names.includes(name)
			? [
					{
						duration: 1,
						entryType: 'mark',
						name: 'commercial event',
						startTime: 1,
					},
			  ]
			: [],
	);

const performance = {
	now: jest.fn(),
	mark: jest.fn(),
	getEntriesByName: jest
		.fn()
		.mockReturnValueOnce([
			{
				duration: 1,
				entryType: 'mark',
				name: 'commercial event',
				startTime: 1,
			},
		])
		.mockReturnValue([]),
};

describe('EventTimer', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performance,
			writable: true,
		});

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

	it('get correct cmp events', () => {
		const performanceCMP = {
			now: jest.fn(),
			mark: jest.fn(),
			getEntriesByName: mockGetEntriesByName([
				'cmp-tcfv2-init',
				'cmp-tcfv2-got-consent',
			]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performanceCMP,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		expect(eventTimer.events).toHaveLength(2);
		expect(eventTimer.events.map((event) => event.name)).toEqual(
			expect.arrayContaining(['cmp-tcfv2-init', 'cmp-tcfv2-init']),
		);
	});

	it('get correct cmp events with additional event mark', () => {
		const performanceCMP = {
			now: jest.fn(),
			mark: jest.fn(),
			getEntriesByName: mockGetEntriesByName([
				'gu.commercial.mark_name',
				'cmp-tcfv2-init',
				'cmp-tcfv2-got-consent',
			]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performanceCMP,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.mark('mark_name');
		expect(eventTimer.events).toHaveLength(3);
		expect(eventTimer.events.map((event) => event.name)).toEqual(
			expect.arrayContaining([
				'cmp-tcfv2-init',
				'cmp-tcfv2-got-consent',
				'mark_name',
			]),
		);
	});

	it('mark produces correct event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.mark('mark_name');
		expect(eventTimer.events).toHaveLength(1);
		expect(eventTimer.events[0].name).toBe('mark_name');
		expect(eventTimer.events[0].ts).toBe(1);
	});

	it('calling mark with performance undefined produces no events', () => {
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: undefined,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.mark('mark_name');
		expect(eventTimer.events).toEqual([]);
	});

	it('when retrieved mark is undefined produce no events', () => {
		const performance = {
			now: jest.fn(),
			mark: jest.fn(),
			getEntriesByName: jest.fn().mockReturnValue([]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performance,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.mark('mark_name');
		expect(eventTimer.events).toEqual([]);
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

	it('triggering two slotReady events causes one mark and one track', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'inline1');
		eventTimer.trigger('slotReady', 'inline1');

		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.first-slotReady'],
		]);

		expect(trackEvent).toHaveBeenCalledTimes(1);

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

	it('trigger two top-above-nav slotReady events', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'top-above-nav');
		eventTimer.trigger('slotReady', 'top-above-nav');

		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['gu.commercial.first-slotReady'],
			['gu.commercial.top-above-nav-slotReady'],
		]);

		expect(trackEvent).toHaveBeenCalledTimes(2);

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
