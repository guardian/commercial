import { EventTimer } from './EventTimer';
import { trackEvent } from './GoogleAnalytics';

jest.mock('./GoogleAnalytics');

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
		// eslint-disable-next-line @typescript-eslint/unbound-method -- for test
		expect(window.performance.mark).toHaveBeenCalledWith(
			'gu.commercial.first-slotReady',
		);
		expect(trackEvent).toHaveBeenCalledWith(
			'gu.commercial.slotReady',
			'first-slotReady',
			'new',
		);
	});

	it('trigger top-above-nav slotReady event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'top-above-nav');
		// eslint-disable-next-line @typescript-eslint/unbound-method -- for test
		expect(window.performance.mark).toHaveBeenCalledWith(
			'gu.commercial.top-above-nav-slotReady',
		);
		expect(trackEvent).toHaveBeenCalledWith(
			'gu.commercial.slotReady',
			'top-above-nav-slotReady',
			'new',
		);
	});

	it('not trigger a GA event if not in GA config', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adOnPage', 'inline1');
		// eslint-disable-next-line @typescript-eslint/unbound-method -- for test
		expect(window.performance.mark).toHaveBeenCalledWith(
			'gu.commercial.first-adOnPage',
		);
		expect(trackEvent).not.toHaveBeenCalled();
	});
});
