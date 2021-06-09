import MockDate from 'mockdate';
import { EventTimer } from './EventTimer';
import { sendCommercialMetrics } from './sendCommercialMetrics';

const PROD_ENDPOINT =
	'//performance-events.guardianapis.com/commercial-metrics';

const DEV_ENDPOINT =
	'//performance-events.code.dev-guardianapis.com/commercial-metrics';

const DEFAULT_DATE = '2021-01-01T12:00:00.000Z';
const PAGE_VIEW_ID = 'pv_id_1234567890';
const BROWSER_ID = 'bwid_abcdefghijklm';

const defaultMetrics = {
	browser_id: BROWSER_ID,
	page_view_id: PAGE_VIEW_ID,
	received_timestamp: DEFAULT_DATE,
	received_date: DEFAULT_DATE.substr(0, 10), // 2021-01-01
	platform: 'NEXT_GEN',
	metrics: [],
	properties: [],
};

const mockSendMetrics = () =>
	sendCommercialMetrics(PAGE_VIEW_ID, BROWSER_ID, false);

const setVisibility = (value: 'hidden' | 'visible' = 'hidden'): void => {
	Object.defineProperty(document, 'visibilityState', {
		value,
		writable: true,
	});
};

describe('sendCommercialMetrics', () => {
	beforeAll(() => {
		MockDate.set(DEFAULT_DATE);
	});

	afterAll(() => {
		MockDate.reset();
	});

	const sendBeacon = jest.fn().mockReturnValue(true);
	Object.defineProperty(navigator, 'sendBeacon', {
		configurable: true,
		enumerable: true,
		value: sendBeacon,
		writable: true,
	});

	it('send commercial metrics success', () => {
		setVisibility();

		expect(mockSendMetrics()).toEqual(true);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[PROD_ENDPOINT, JSON.stringify(defaultMetrics)],
		]);
	});

	it('commercial metrics not sent when window is visible', () => {
		setVisibility('visible');

		expect(mockSendMetrics()).toEqual(false);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
	});

	describe('handles various configurations', () => {
		afterEach(() => {
			// Reset the properties of the event timer for the purposes of this test
			delete window.guardian.commercialTimer;
			void EventTimer.get();
		});

		it('should handle endpoint in dev', () => {
			setVisibility();

			expect(
				sendCommercialMetrics(PAGE_VIEW_ID, BROWSER_ID, true),
			).toEqual(true);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					DEV_ENDPOINT,
					JSON.stringify({
						...defaultMetrics,
						properties: [{ name: 'isDev', value: 'localhost' }],
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
					PROD_ENDPOINT,
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
				sendCommercialMetrics(PAGE_VIEW_ID, BROWSER_ID, true),
			).toEqual(true);

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					DEV_ENDPOINT,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'downlink', value: '1' },
							{ name: 'effectiveType', value: '4g' },
							{ name: 'isDev', value: 'localhost' },
						],
					}),
				],
			]);
		});
	});
});
