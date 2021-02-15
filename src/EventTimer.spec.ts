import { EventTimer } from './EventTimer';

describe('EventTimer', () => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- delete performance to mock it as is readonly
	delete (window as any).performance;

	window.guardian = {};

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

	it('trigger first slotReady event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'inline1');
		expect(window.performance.mark).toHaveBeenCalledWith(
			'gu.commercial.first-slotReady',
		);
	});

	it('trigger top-above-nav slotReady event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('slotReady', 'top-above-nav');
		expect(window.performance.mark).toHaveBeenCalledWith(
			'gu.commercial.top-above-nav-slotReady',
		);
	});
});
