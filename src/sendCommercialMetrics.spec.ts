import MockDate from 'mockdate';
import { sendCommercialMetrics } from './sendCommercialMetrics';

describe('sendCommercialMetrics', () => {
	beforeAll(() => {
		MockDate.set('Fri Jan 1 2021 12:00:00 GMT+0000 (Greenwich Mean Time)');
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
		Object.defineProperty(document, 'visibilityState', {
			value: 'hidden',
			writable: true,
		});
		expect(
			sendCommercialMetrics('page view id', 'browser id', true),
		).toEqual(true);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[
				'//performance-events.code.dev-guardianapis.com/commercial-metrics',
				JSON.stringify({
					browser_id: 'browser id',
					page_view_id: 'page view id',
					received_timestamp: '2021-01-01T12:00:00.000Z',
					received_date: '2021-01-01',
					platform: 'NEXT_GEN',
					metrics: [],
					properties: [
						{ name: 'downlink', value: 'undefined' },
						{ name: 'effectiveType', value: 'undefined' },
						{ name: 'isDev', value: 'localhost' },
					],
				}),
			],
		]);
	});

	it('commercial metrics not sent when window is visible', () => {
		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			writable: true,
		});
		expect(
			sendCommercialMetrics('page view id', 'browser id', true),
		).toEqual(false);

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
	});
});
