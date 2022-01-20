import { EventTimer } from './EventTimer';
import {
	_,
	bypassCommercialMetricsSampling,
	initCommercialMetrics,
} from './sendCommercialMetrics';
import type { Metric, Property, TimedEvent } from './sendCommercialMetrics';

const {
	Endpoints,
	filterUndefinedEventTimerProperties,
	getAdBlockerProperties,
	getDevProperties,
	getEndpoint,
	mapEventTimerPropertiesToString,
	reset,
	roundTimeStamp,
} = _;

const PAGE_VIEW_ID = 'pv_id_1234567890';
const BROWSER_ID = 'bwid_abcdefghijklm';
const IS_NOT_DEV = false;
const IS_DEV = true;
const ADBLOCK_NOT_IN_USE = false;

const defaultMetrics = {
	page_view_id: PAGE_VIEW_ID,
	browser_id: BROWSER_ID,
	platform: 'NEXT_GEN',
	metrics: [],
	properties: [],
};

const mockSendMetrics = () =>
	initCommercialMetrics(PAGE_VIEW_ID, BROWSER_ID, IS_NOT_DEV);

const setVisibility = (value: 'hidden' | 'visible' = 'hidden'): void => {
	Object.defineProperty(document, 'visibilityState', {
		value,
		writable: true,
	});
};

describe('send commercial metrics code', () => {
	const sendBeacon = jest.fn().mockReturnValue(true);
	Object.defineProperty(navigator, 'sendBeacon', {
		configurable: true,
		enumerable: true,
		value: sendBeacon,
		writable: true,
	});

	const mockConsoleWarn = jest
		.spyOn(console, 'warn')
		.mockImplementation(() => false);

	it('send commercial metrics success', () => {
		setVisibility();

		expect(mockSendMetrics()).toEqual(true);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, JSON.stringify(defaultMetrics)],
		]);
	});

	it('commercial metrics not sent when window is visible', () => {
		setVisibility('visible');

		expect(mockSendMetrics()).toEqual(false);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
	});

	describe('bypassCommercialMetricsSampling', () => {
		it('sends a beacon if bypassed asynchronously', () => {
			bypassCommercialMetricsSampling(IS_DEV);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[Endpoints.CODE, JSON.stringify(defaultMetrics)],
			]);
		});

		it('expect to be initialised before calling bypassCoreWebVitalsSampling', () => {
			reset();
			bypassCommercialMetricsSampling(IS_NOT_DEV);

			expect(mockConsoleWarn).toHaveBeenCalledWith(
				'initCommercialMetrics not yet initialised',
			);
		});
	});

	describe('handles various configurations', () => {
		afterEach(() => {
			// Reset the properties of the event timer for the purposes of this test
			delete window.guardian.commercialTimer;
			void EventTimer.get();
			reset();
		});

		it('should handle endpoint in dev', () => {
			setVisibility();

			expect(
				initCommercialMetrics(
					PAGE_VIEW_ID,
					BROWSER_ID,
					IS_DEV,
					ADBLOCK_NOT_IN_USE,
				),
			).toEqual(true);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'isDev', value: 'localhost' },
							{ name: 'adBlockerInUse', value: 'false' },
						],
					}),
				],
			]);
		});

		it('should handle connection properties if they exist', () => {
			const eventTimer = EventTimer.get();

			// Fix the properties of the event timer for the purposes of this test
			eventTimer.properties = {
				downlink: 1,
				effectiveType: '4g',
			};

			setVisibility();

			expect(mockSendMetrics()).toEqual(true);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'downlink', value: '1' },
							{ name: 'effectiveType', value: '4g' },
						],
					}),
				],
			]);
		});

		it('should merge properties adequately', () => {
			const eventTimer = EventTimer.get();

			// Fix the properties of the event timer for the purposes of this test
			eventTimer.properties = {
				downlink: 1,
				effectiveType: '4g',
			};

			Object.defineProperty(document, 'visibilityState', {
				value: 'hidden',
				writable: true,
			});
			expect(
				initCommercialMetrics(
					PAGE_VIEW_ID,
					BROWSER_ID,
					IS_DEV,
					ADBLOCK_NOT_IN_USE,
				),
			).toEqual(true);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'downlink', value: '1' },
							{ name: 'effectiveType', value: '4g' },
							{ name: 'isDev', value: 'localhost' },
							{ name: 'adBlockerInUse', value: 'false' },
						],
					}),
				],
			]);
		});
	});
});

describe('send commercial metrics helpers', () => {
	const filteredProperties: Array<[string, string | number]> = [
		['downlink', 1],
		['effectiveType', '4g'],
	];
	const mappedProperties: Property[] = [
		{
			name: 'downlink',
			value: '1',
		},
		{
			name: 'effectiveType',
			value: '4g',
		},
	];
	const roundedEvent: Metric[] = [
		{
			name: 'cmp-tcfv2-init',
			value: 1519211809935,
		},
	];
	const adBlockerProperties: Property[] = [
		{
			name: 'adBlockerInUse',
			value: 'false',
		},
	];

	const devProperties = [
		{
			name: 'isDev',
			value: 'localhost',
		},
	];

	it('can filter out event timer properties with a value that is undefined', () => {
		const eventProperties = {
			type: undefined,
			downlink: 1,
			effectiveType: '4g',
		};
		const filtered = filterUndefinedEventTimerProperties(eventProperties);
		expect(filtered).toEqual(filteredProperties);
	});

	it('can map event timer properties to the required format', () => {
		const mapped = mapEventTimerPropertiesToString(filteredProperties);
		expect(mapped).toEqual(mappedProperties);
	});

	// This one is seemingly not doing anything as the start and end values match
	it('can round up the value of timestamps', () => {
		const event: TimedEvent[] = [
			{
				name: 'cmp-tcfv2-init',
				ts: 1519211809934.234,
			},
		];
		const rounded = roundTimeStamp(event);
		expect(rounded).toEqual(roundedEvent);
	});

	it('can create an adBlocker property', () => {
		const adBlockerInUse = false;
		const property = getAdBlockerProperties(adBlockerInUse);
		expect(property).toEqual(adBlockerProperties);
	});

	it('can create a property about the env', () => {
		const property = getDevProperties(true);
		expect(property).toEqual(devProperties);
		const isNotDev = getDevProperties(false);
		expect(isNotDev).toEqual([]);
	});

	it('can get the correct endpoint depending on the env', () => {
		const isDev = true;
		const endpoint = getEndpoint(isDev);
		expect(endpoint).toBe(Endpoints.CODE);
	});
});
