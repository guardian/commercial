import { EventTimer } from './event-timer';

const mockGetEntriesByName = (names: string[]) =>
	jest.fn((name: string) =>
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

const mockEntries: Array<PerformanceMark | PerformanceMeasure> = [];

const mockMark = jest.fn((name: string): PerformanceMark => {
	const mark = {
		name,
		duration: 1,
		entryType: 'mark',
		startTime: 1,
		detail: {},
		toJSON: () => '',
	};
	mockEntries.push(mark);
	return mark;
});
const mockMeasure = jest.fn((name: string): PerformanceMeasure => {
	const measure = {
		name,
		duration: 1,
		entryType: 'measure',
		startTime: 1,
		detail: {},
		toJSON: () => '',
	};
	mockEntries.push(measure);
	return measure;
});

const performance = {
	now: jest.fn(),
	mark: mockMark,
	measure: mockMeasure,
	getEntriesByName: jest.fn((name: string) => [
		mockEntries.filter((e) => e.name === name),
	]),
};

const MARK_NAME = 'commercialStart';
const CMP_INIT = 'cmp-init';
const CMP_GOT_CONSENT = 'cmp-got-consent';

const DEFAULT_CONFIG = {
	isDotcomRendering: true,
	ophan: { pageViewId: 'pv_id_1234567890' },
	page: {
		dcrCouldRender: true,
		edition: 'UK' as const,
		isPreview: false,
		isSensitive: false,
		pageId: 'world/uk',
		section: 'uk-news',
		videoDuration: 63,
		webPublicationDate: 608857200,
	},
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
				...DEFAULT_CONFIG,
				googleAnalytics: {
					trackers: {
						editorial: 'gaTrackerTest',
					},
				},
			},
		} as typeof window.guardian;

		EventTimer.init();
	});

	it('get correct cmp events', () => {
		const performanceCMP = {
			now: jest.fn(),
			mark: jest.fn(),
			getEntriesByName: mockGetEntriesByName([CMP_INIT, CMP_GOT_CONSENT]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performanceCMP,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		expect(eventTimer.events).toHaveLength(2);
		expect(eventTimer.events.map(({ name }) => name).sort()).toEqual(
			[CMP_GOT_CONSENT, CMP_INIT].sort(),
		);
	});

	it('get correct cmp events with additional event mark', () => {
		const performanceCMP = {
			now: jest.fn(),
			mark: mockMark,
			getEntriesByName: mockGetEntriesByName([
				MARK_NAME,
				CMP_INIT,
				CMP_GOT_CONSENT,
			]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performanceCMP,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.trigger(MARK_NAME);
		expect(eventTimer.events).toHaveLength(3);
		expect(eventTimer.events.map(({ name }) => name)).toEqual([
			MARK_NAME,
			CMP_INIT,
			CMP_GOT_CONSENT,
		]);
	});

	it('mark produces correct event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger(MARK_NAME);
		expect(eventTimer.events[0]?.ts).toBeDefined();
		expect(eventTimer.events[0]?.ts).toBe(1);
	});

	it('calling trigger with performance undefined produces no events', () => {
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: undefined,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.trigger(MARK_NAME);
		expect(eventTimer.events.length).toBe(0);
	});

	it('when retrieved and mark is undefined produce no events', () => {
		const performance = {
			now: jest.fn(),
			mark: undefined,
			getEntriesByName: jest.fn().mockReturnValue([]),
		};
		Object.defineProperty(window, 'performance', {
			configurable: true,
			enumerable: true,
			value: performance,
			writable: true,
		});
		const eventTimer = EventTimer.get();
		eventTimer.trigger(MARK_NAME);
		expect(eventTimer.events.length).toBe(0);
	});

	it('trigger top-above-nav loadAdStart event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('loadAdStart', 'top-above-nav');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['top-above-nav:loadAdStart'],
		]);
	});

	it('trigger two top-above-nav adOnPage events', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adOnPage', 'top-above-nav');
		eventTimer.trigger('adOnPage', 'top-above-nav');

		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['top-above-nav:adOnPage'],
		]);
	});

	it('trigger commercial start page event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger(MARK_NAME);
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			[MARK_NAME],
		]);
	});

	it('trigger commercial end page event', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adOnPage', 'top-above-nav');
		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['top-above-nav:adOnPage'],
		]);
	});

	it('trigger measure for 2 marks', () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adRenderStart', 'top-above-nav');
		eventTimer.trigger('adRenderEnd', 'top-above-nav');

		expect((window.performance.mark as jest.Mock).mock.calls).toEqual([
			['top-above-nav:adRenderStart'],
			['top-above-nav:adRenderEnd'],
		]);

		expect((window.performance.measure as jest.Mock).mock.calls).toEqual([
			[
				'top-above-nav:adRenderDuration',
				'top-above-nav:adRenderStart',
				'top-above-nav:adRenderEnd',
			],
		]);
	});

	it("trigger measure marks don't appear in EventTimer.events", () => {
		const eventTimer = EventTimer.get();
		eventTimer.trigger('adRenderStart');
		eventTimer.trigger('adRenderEnd');

		expect(eventTimer.events.map(({ name }) => name)).not.toContain([
			'adRenderStart',
			'adRenderEnd',
		]);
	});

	it('handles no experimental properties', () => {
		const eventTimer = EventTimer.get();
		expect(eventTimer.properties).toEqual({});
	});

	describe('experimental window properties', () => {
		it('sets connection', () => {
			// @ts-expect-error -- we’re overriding a readonly value
			window.navigator.connection = {};
		});

		it('handles experimental property window.navigator.connection', () => {
			const eventTimer = EventTimer.get();
			expect(eventTimer.properties).toEqual({});
		});

		it('sets values', () => {
			// @ts-expect-error -- we’re overriding a readonly value
			window.navigator.connection = {
				type: 'other',
				downlink: 2,
				effectiveType: '3g',
			};
		});

		it('handles experimental property window.navigator.connection', () => {
			const eventTimer = EventTimer.get();
			expect(eventTimer.properties).toEqual({
				effectiveType: '3g',
				downlink: 2,
				type: 'other',
			});
		});

		it('remove values', () => {
			// @ts-expect-error -- we’re resetting a readonly value
			delete window.navigator.connection;
		});
	});
});
