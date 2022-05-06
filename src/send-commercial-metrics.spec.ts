import { onConsent } from '@guardian/consent-management-platform';
import type { ConsentState } from '@guardian/consent-management-platform/dist/types';
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

jest.mock('@guardian/consent-management-platform');

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
	ccpa: { doNotSell: false },
	canTarget: true,
	framework: 'ccpa',
};

const ccpaNonConsent: ConsentState = {
	ccpa: { doNotSell: true },
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

describe('send commercial metrics', () => {
	Object.defineProperty(navigator, 'sendBeacon', {
		configurable: true,
		enumerable: true,
		value: jest.fn(),
		writable: true,
	});

	const mockConsoleWarn = jest
		.spyOn(console, 'warn')
		.mockImplementation(() => false);

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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, JSON.stringify(defaultMetrics)],
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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, JSON.stringify(defaultMetrics)],
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

		expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
			[Endpoints.PROD, JSON.stringify(defaultMetrics)],
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

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[Endpoints.PROD, JSON.stringify(defaultMetrics)],
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

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([]);
		});

		it('expects to be initialised before calling bypassCoreWebVitalsSampling', async () => {
			await bypassCommercialMetricsSampling();

			expect(mockConsoleWarn).toHaveBeenCalledWith(
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

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.PROD,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'downlink', value: '1' },
							{ name: 'effectiveType', value: '4g' },
							{ name: 'adBlockerInUse', value: 'false' },
						],
					}),
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

			const mathRandomSpy = jest.spyOn(Math, 'random');
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

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
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

			expect((navigator.sendBeacon as jest.Mock).mock.calls).toEqual([
				[
					Endpoints.CODE,
					JSON.stringify({
						...defaultMetrics,
						properties: [
							{ name: 'adSlotsInline', value: '5' },
							{ name: 'adSlotsTotal', value: '10' },
							{ name: 'isDev', value: 'localhost' },
						],
					}),
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
			roundTimeStamp([
				{
					name: 'cmp-tcfv2-init',
					ts: 1519211809934.234,
				},
			]),
		).toEqual([
			{
				name: 'cmp-tcfv2-init',
				value: 1519211809935,
			},
		]);
	});
});
