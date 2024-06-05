import type { ConsentState } from '@guardian/libs';
import { onConsent } from '@guardian/libs';
import { EventTimer } from './event-timer';
import {
	_,
	bypassCommercialMetricsSampling,
	initCommercialMetrics,
} from './send-commercial-metrics';

const {
	Endpoints,
	mapEventTimerPropertiesToString,
	reset,
	roundTimeStamp,
	transformToObjectEntries,
} = _;

jest.mock('@guardian/libs', () => ({
	// eslint-disable-next-line -- ESLint doesn't understand jest.requireActual
	...jest.requireActual<typeof import('@guardian/libs')>('@guardian/libs'),
	onConsent: jest.fn(),
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockImplementation(() =>
		Promise.resolve(consentState),
	);

const PAGE_VIEW_ID = 'pv_id_1234567890';
const BROWSER_ID = 'bwid_abcdefghijklm';
const IS_NOT_DEV = false;
const IS_DEV = true;
const ADBLOCK_NOT_IN_USE = false;
const USER_IN_SAMPLING = 100 / 100;
const USER_NOT_IN_SAMPLING = -1;

const defaultMetrics = {
	page_view_id: PAGE_VIEW_ID,
	browser_id: BROWSER_ID,
	platform: 'NEXT_GEN',
	metrics: [],
	properties: [
		{
			name: 'adBlockerInUse',
			value: 'false',
		},
	],
};

const expectedOptions = {
	method: 'POST',
	body: JSON.stringify(defaultMetrics),
	keepalive: true,
	cache: 'no-store',
	mode: 'no-cors',
};

const tcfv2AllConsent: ConsentState = {
	tcfv2: {
		consents: {
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
		},
		vendorConsents: { 100: true, 200: true, 300: true },
		eventStatus: 'tcloaded',
		addtlConsent: '',
		gdprApplies: true,
		tcString: 'blablabla',
	},
	canTarget: true,
	framework: 'tcfv2',
};

const tcfv2AllConsentExceptPurpose8: ConsentState = {
	tcfv2: {
		consents: {
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: false,
			9: true,
			10: true,
		},
		vendorConsents: { 100: true, 200: true, 300: true },
		eventStatus: 'tcloaded',
		addtlConsent: '',
		gdprApplies: true,
		tcString: 'blablabla',
	},
	canTarget: false,
	framework: 'tcfv2',
};

const ccpaConsent: ConsentState = {
	ccpa: { doNotSell: false, signalStatus: 'ready' },
	canTarget: true,
	framework: 'ccpa',
};

const ccpaNonConsent: ConsentState = {
	ccpa: { doNotSell: true, signalStatus: 'ready' },
	canTarget: false,
	framework: 'ccpa',
};

const setVisibility = (value: 'hidden' | 'visible'): void => {
	Object.defineProperty(document, 'visibilityState', {
		value,
		writable: true,
	});
};

beforeEach(() => {
	reset();
	jest.resetAllMocks();
});

afterEach(() => {
	jest.spyOn(global.Math, 'random').mockRestore();
});

describe('send commercial metrics', () => {
	Object.defineProperty(window, 'fetch', {
		configurable: true,
		enumerable: true,
		value: jest.fn(),
		writable: true,
	});

	console.warn = jest.fn().mockImplementation(() => false);

	it('sends metrics when the page is hidden, user is in sampling group, and consent is given', async () => {
		mockOnConsent(tcfv2AllConsent);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		setVisibility('hidden');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, expectedOptions],
		]);
	});

	it('does not send metrics when page is visible', async () => {
		mockOnConsent(tcfv2AllConsent);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		setVisibility('visible');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([]);
	});

	it('does not send metrics when user is not in sampling group', async () => {
		mockOnConsent(tcfv2AllConsent);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_NOT_IN_SAMPLING,
		});

		setVisibility('hidden');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([]);
	});

	it('does not send metrics when consent does not include purpose 8', async () => {
		mockOnConsent(tcfv2AllConsentExceptPurpose8);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		setVisibility('hidden');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([]);
	});

	it('sends metrics when non-TCFv2 user (i.e. USA or Australia) consents', async () => {
		mockOnConsent(ccpaConsent);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		setVisibility('hidden');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, expectedOptions],
		]);
	});

	it('sends metrics when non-TCFv2 user (i.e. USA or Australia) does not consent', async () => {
		mockOnConsent(ccpaNonConsent);

		await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		setVisibility('hidden');
		global.dispatchEvent(new Event('visibilitychange'));

		expect((window.fetch as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, expectedOptions],
		]);
	});

	it('only initialises once (and returns false on further attempts)', async () => {
		mockOnConsent(tcfv2AllConsent);

		const firstInit = await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		const secondInit = await initCommercialMetrics({
			pageViewId: PAGE_VIEW_ID,
			browserId: BROWSER_ID,
			isDev: IS_NOT_DEV,
			adBlockerInUse: ADBLOCK_NOT_IN_USE,
			sampling: USER_IN_SAMPLING,
		});

		expect(firstInit).toEqual(true);
		expect(secondInit).toEqual(false);
	});

	describe('bypassCommercialMetricsSampling', () => {
		it('sends metrics when user is not in sampling group but sampling is bypassed', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_NOT_IN_SAMPLING,
			});
			await bypassCommercialMetricsSampling();

			setVisibility('hidden');
			global.dispatchEvent(new Event('visibilitychange'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[Endpoints.PROD, expectedOptions],
			]);
		});

		it('does not send metrics when sampling is bypassed but consent is not given', async () => {
			mockOnConsent(tcfv2AllConsentExceptPurpose8);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_NOT_IN_SAMPLING,
			});
			await bypassCommercialMetricsSampling();

			setVisibility('hidden');
			global.dispatchEvent(new Event('visibilitychange'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([]);
		});

		it('expects to be initialised before calling bypassCoreWebVitalsSampling', async () => {
			await bypassCommercialMetricsSampling();

			expect(console.warn).toHaveBeenCalledWith(
				'initCommercialMetrics not yet initialised',
			);
		});
	});

	describe('handles various configurations', () => {
		afterEach(() => {
			// Reset the properties of the event timer for the purposes of these tests
			delete window.guardian.commercialTimer;
			void EventTimer.get();
		});

		it('should handle endpoint in dev', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			setVisibility('hidden');
			global.dispatchEvent(new Event('visibilitychange'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							properties: [
								{
									name: 'isDev',
									value: 'testurl.theguardian.com',
								},
								{ name: 'adBlockerInUse', value: 'false' },
							],
						}),
					},
				],
			]);
		});

		it('should handle connection properties if they exist', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			// Fix the properties of the event timer for the purposes of this test
			const eventTimer = EventTimer.get();
			eventTimer.properties = {
				downlink: 1,
				effectiveType: '4g',
			};

			setVisibility('hidden');
			global.dispatchEvent(new Event('visibilitychange'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							properties: [
								{ name: 'downlink', value: '1' },
								{ name: 'effectiveType', value: '4g' },
								{ name: 'adBlockerInUse', value: 'false' },
							],
						}),
					},
				],
			]);
		});

		it('should merge properties adequately', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			// Fix the properties of the event timer for the purposes of this test
			const eventTimer = EventTimer.get();
			eventTimer.properties = {
				downlink: 1,
				effectiveType: '4g',
			};

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							properties: [
								{ name: 'downlink', value: '1' },
								{ name: 'effectiveType', value: '4g' },
								{
									name: 'isDev',
									value: 'testurl.theguardian.com',
								},
								{ name: 'adBlockerInUse', value: 'false' },
							],
						}),
					},
				],
			]);
		});

		it('should return false if user is not in sampling', async () => {
			const willSendMetrics = await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_NOT_IN_SAMPLING,
			});

			expect(willSendMetrics).toEqual(false);
		});

		it('should set sampling at 0.01 if sampling is not passed in', async () => {
			const willSendMetrics = await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
			});

			const mathRandomSpy = jest.spyOn(global.Math, 'random');
			mathRandomSpy.mockImplementation(() => 0.5);

			expect(willSendMetrics).toEqual(false);
		});

		it('should merge properties even if adblocking is not passed in', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_DEV,
				adBlockerInUse: undefined,
				sampling: USER_IN_SAMPLING,
			});

			// Fix the properties of the event timer for the purposes of this test
			const eventTimer = EventTimer.get();
			eventTimer.properties = {
				downlink: 1,
				effectiveType: '4g',
			};

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							properties: [
								{ name: 'downlink', value: '1' },
								{ name: 'effectiveType', value: '4g' },
								{
									name: 'isDev',
									value: 'testurl.theguardian.com',
								},
							],
						}),
					},
				],
			]);
		});

		it('should handle ad slot properties', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_DEV,
			});

			const eventTimer = EventTimer.get();
			eventTimer.setProperty('adSlotsInline', 5);
			eventTimer.setProperty('adSlotsTotal', 10);

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							properties: [
								{ name: 'adSlotsInline', value: '5' },
								{ name: 'adSlotsTotal', value: '10' },
								{
									name: 'isDev',
									value: 'testurl.theguardian.com',
								},
							],
						}),
					},
				],
			]);
		});
	});

	describe('record offline count', () => {
		it('returns the value if present', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			window.guardian.offlineCount = 3;

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							metrics: [{ name: 'offlineCount', value: 3 }],
						}),
					},
				],
			]);
		});

		it('records a value of 0, even if falsy', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			window.guardian.offlineCount = 0;

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							metrics: [{ name: 'offlineCount', value: 0 }],
						}),
					},
				],
			]);
		});

		it('returns nothing if absent', async () => {
			mockOnConsent(tcfv2AllConsent);

			await initCommercialMetrics({
				pageViewId: PAGE_VIEW_ID,
				browserId: BROWSER_ID,
				isDev: IS_NOT_DEV,
				adBlockerInUse: ADBLOCK_NOT_IN_USE,
				sampling: USER_IN_SAMPLING,
			});

			delete window.guardian.offlineCount;

			setVisibility('hidden');
			global.dispatchEvent(new Event('pagehide'));

			expect((window.fetch as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					{
						...expectedOptions,
						body: JSON.stringify({
							...defaultMetrics,
							metrics: [],
						}),
					},
				],
			]);
		});
	});
});

describe('send commercial metrics helpers', () => {
	it('can transform event timer properties into object entries', () => {
		expect(
			transformToObjectEntries({
				type: undefined,
				downlink: 1,
				effectiveType: '4g',
			}),
		).toEqual([
			['type', undefined],
			['downlink', 1],
			['effectiveType', '4g'],
		]);
	});

	it('can map event timer properties to the required format', () => {
		expect(
			mapEventTimerPropertiesToString([
				['downlink', 1],
				['effectiveType', '4g'],
			]),
		).toEqual([
			{
				name: 'downlink',
				value: '1',
			},
			{
				name: 'effectiveType',
				value: '4g',
			},
		]);
	});

	it('can round up the value of timestamps', () => {
		expect(
			roundTimeStamp(
				[
					{
						name: 'test-metric',
						ts: 1519211809934.234,
					},
				],
				[
					{
						name: 'test-measure',
						duration: 1519211809934.234,
					},
				],
			),
		).toEqual([
			{
				name: 'test-metric',
				value: 1519211809935,
			},
			{
				name: 'test-measure',
				value: 1519211809935,
			},
		]);
	});
});
