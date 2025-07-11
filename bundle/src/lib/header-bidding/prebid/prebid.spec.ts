import { type ConsentState } from '@guardian/libs';
import { getConsentFor } from '@guardian/libs';
import { isUserInVariant } from '../../../experiments/ab';
import { pubmatic } from '../../__vendor/pubmatic';
import { getAdvertById as getAdvertById_ } from '../../dfp/get-advert-by-id';
import { shouldIncludeBidder, shouldIncludePermutive } from '../utils';
import { prebid } from './prebid';

const getAdvertById = getAdvertById_ as jest.Mock;

jest.mock('define/Advert', () =>
	jest.fn().mockImplementation(() => ({ advert: jest.fn() })),
);

jest.mock('./bid-config', () => ({
	bids: jest.fn(),
}));

jest.mock('lib/dfp/get-advert-by-id', () => ({
	getAdvertById: jest.fn(),
}));

jest.mock('../utils', () => ({
	...jest.requireActual('../utils.ts'),
	shouldIncludePermutive: jest.fn().mockReturnValue(true),
	shouldIncludeBidder: jest
		.fn()
		.mockReturnValue(jest.fn().mockReturnValue(true)),
}));

jest.mock('experiments/ab', () => ({
	isUserInVariant: jest.fn(),
}));

jest.mock('@guardian/libs', () => ({
	...jest.requireActual('@guardian/libs'),
	getConsentFor: jest.fn(),
}));

const mockGetConsentForID5 = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockImplementation((vendor: string) =>
		vendor === 'id5' ? hasConsent : undefined,
	);

const mockConsentState = {
	tcfv2: {
		consents: { '': true },
		eventStatus: 'useractioncomplete',
		vendorConsents: { '': true },
		addtlConsent: '',
		gdprApplies: true,
		tcString: '',
	},
	gpcSignal: true,
	canTarget: true,
	framework: 'tcfv2',
} satisfies ConsentState;

const resetPrebid = () => {
	delete window.pbjs;
	// @ts-expect-error -- there’s no types for this
	delete window.pbjsChunk;
	jest.resetModules();
	jest.requireActual('lib/header-bidding/prebid/pbjs');
};

describe('initialise', () => {
	beforeEach(() => {
		resetPrebid();
		window.guardian.config.switches.consentManagement = true;
		window.guardian.config.switches.prebidUserSync = true;
		window.guardian.config.page.keywords = 'Key,Words';
		getAdvertById.mockReset();
	});

	test('should generate correct Prebid config when all switches are on and all bidders included', () => {
		jest.mocked(shouldIncludeBidder).mockReturnValue(
			jest.fn().mockReturnValue(true),
		);
		jest.mocked(isUserInVariant).mockReturnValue(false);
		window.guardian.config.switches.prebidBidCache = true;
		mockGetConsentForID5(true);

		prebid.initialise(window, mockConsentState);

		expect(window.pbjs?.getConfig()).toMatchObject({
			auctionOptions: {},
			bidderSequence: 'random',
			bidderTimeout: 1500,
			consentManagement: {
				gdpr: {
					cmpApi: 'iab',
					defaultGdprScope: true,
					timeout: 200,
				},
			},
			customPriceBucket: {
				buckets: [
					{
						max: 10,
						increment: 0.01,
					},
					{
						max: 15,
						increment: 0.1,
					},
					{
						max: 100,
						increment: 1,
					},
				],
			},
			debug: false,
			deviceAccess: true,
			disableAjaxTimeout: false,
			enableSendAllBids: true,
			maxBid: 5000,
			maxNestedIframes: 10,
			mediaTypePriceGranularity: {},
			ortb2: {
				site: {
					ext: {
						data: {
							keywords: ['Key', 'Words'],
						},
					},
				},
			},
			priceGranularity: 'custom',
			s2sConfig: {
				adapter: 'prebidServer',
				adapterOptions: {},
				allowUnknownBidderCodes: false,
				bidders: [],
				maxBids: 1,
				maxTimeout: 1500,
				ortbNative: {
					eventtrackers: [
						{
							event: 1,
							methods: [1, 2],
						},
					],
				},
				syncTimeout: 1000,
				syncUrlModifier: {},
			},
			timeoutBuffer: 400,
			useBidCache: true,
			userSync: {
				syncDelay: 3000,
				syncEnabled: true,
				syncsPerBidder: 0,
				userIds: [
					{
						name: 'sharedId',
						storage: {
							type: 'cookie',
							name: '_pubcid',
							expires: 365,
						},
					},
					{
						name: 'id5Id',
						params: {
							partner: 182,
						},
						storage: {
							type: 'html5',
							name: 'id5id',
							expires: 90,
							refreshInSeconds: 7200,
						},
					},
				],
				auctionDelay: 500,
				filterSettings: {
					all: {
						bidders: '*',
						filter: 'include',
					},
				},
			},
			realTimeData: {
				dataProviders: [
					{
						name: 'permutive',
						params: {
							acBidders: [
								'appnexus',
								'ix',
								'ozone',
								'pubmatic',
								'trustx',
							],
							overwrites: {
								pubmatic,
							},
						},
					},
				],
			},
		});
	});

	test('should generate correct Prebid config when no consent for ID5', () => {
		jest.mocked(shouldIncludeBidder).mockReturnValue(
			jest.fn().mockReturnValue(true),
		);
		jest.mocked(isUserInVariant).mockReturnValue(false);

		mockGetConsentForID5(false);
		prebid.initialise(window, mockConsentState);

		expect(window.pbjs?.getConfig('userSync')).toMatchObject({
			syncDelay: 3000,
			syncEnabled: true,
			syncsPerBidder: 0,
			userIds: [
				{
					name: 'sharedId',
					storage: {
						type: 'cookie',
						name: '_pubcid',
						expires: 365,
					},
				},
			],
			auctionDelay: 500,
			filterSettings: {
				all: {
					bidders: '*',
					filter: 'include',
				},
			},
		});
	});

	test('should generate correct Prebid config consent management in USNAT', () => {
		prebid.initialise(window, { ...mockConsentState, framework: 'usnat' });
		expect(window.pbjs?.getConfig('consentManagement')).toEqual({
			gpp: {
				cmpApi: 'iab',
				timeout: 1500,
			},
		});
	});

	test('should generate correct Prebid config consent management in AUS', () => {
		prebid.initialise(window, { ...mockConsentState, framework: 'aus' });
		expect(window.pbjs?.getConfig('consentManagement')).toEqual({
			usp: {
				cmpApi: 'iab',
				timeout: 1500,
			},
		});
	});

	test('should generate correct Prebid config when consent management off', () => {
		window.guardian.config.switches.consentManagement = false;
		prebid.initialise(window, mockConsentState);
		expect(window.pbjs?.getConfig('consentManagement')).toBeUndefined();
	});

	test('should set value of useBidCache correctly in Prebid config when the switch is on', () => {
		window.guardian.config.switches.prebidBidCache = true;
		prebid.initialise(window, mockConsentState);
		expect(window.pbjs?.getConfig('useBidCache')).toBe(true);
	});

	test('should set value of useBidCache correctly in Prebid config when the switch is off', () => {
		window.guardian.config.switches.prebidBidCache = false;
		prebid.initialise(window, mockConsentState);
		expect(window.pbjs?.getConfig('useBidCache')).toBe(false);
	});

	test('should not include realTimeData object if permutive should not be included', () => {
		jest.mocked(shouldIncludePermutive).mockReturnValue(false);
		prebid.initialise(window, mockConsentState);

		expect(window.pbjs?.getConfig('realTimeData')).toBeUndefined();
	});

	describe('permutive realTimeData', () => {
		test('should filter out non included bidders from permutive acBidders array', () => {
			jest.mocked(shouldIncludePermutive).mockReturnValue(true);
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest
					.fn()
					.mockReturnValueOnce(true) // and (appnexus)
					.mockReturnValueOnce(false) // ix
					.mockReturnValueOnce(true) // ozone
					.mockReturnValueOnce(true) // pubmatic
					.mockReturnValueOnce(false), // trustx
			);

			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.getConfig()).toMatchObject({
				realTimeData: {
					dataProviders: [
						{
							name: 'permutive',
							params: {
								acBidders: ['appnexus', 'ozone', 'pubmatic'],
								overwrites: {
									pubmatic,
								},
							},
						},
					],
				},
			});
		});

		test('should filter out pubmatic from the overwrites field and the acBidders array if shouldInclude is false', () => {
			jest.mocked(shouldIncludePermutive).mockReturnValue(true);
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest
					.fn()
					.mockReturnValueOnce(true) // and (appnexus)
					.mockReturnValueOnce(true) // ix
					.mockReturnValueOnce(true) // ozone
					.mockReturnValueOnce(false) // pubmatic
					.mockReturnValueOnce(true), // trustx
			);

			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.getConfig()).toMatchObject({
				realTimeData: {
					dataProviders: [
						{
							name: 'permutive',
							params: {
								acBidders: [
									'appnexus',
									'ix',
									'ozone',
									'trustx',
								],
							},
						},
					],
				},
			});
		});
	});

	describe('criteo bidder settings', () => {
		test('should generate correct bidder settings for criteo if included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(true),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.criteo).toMatchObject({
				storageAllowed: true,
			});
		});

		test('should omit criteo bidder settings if not included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(false),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.criteo).toBeUndefined();
		});
	});

	describe('xaxis bidder settings', () => {
		test('should generate correct bidder settings for xaxis if included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(true),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.xhb).toHaveProperty(
				'adserverTargeting',
			);
		});

		test('should omit xaxis bidder settings if not included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(false),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.xhb).toBeUndefined();
		});
	});
	describe('kargo bidder settings', () => {
		test('should generate correct bidder settings for kargo if included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(true),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.kargo).toMatchObject({
				storageAllowed: true,
			});
		});

		test('should omit kargo bidder settings if not included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(false),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.kargo).toBeUndefined();
		});
	});

	describe('magnite bidder settings', () => {
		test('should generate correct bidder settings for magnite if included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(true),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.magnite).toMatchObject({
				storageAllowed: true,
			});
		});

		test('should omit magnite bidder settings if not included', () => {
			jest.mocked(shouldIncludeBidder).mockReturnValue(
				jest.fn().mockReturnValue(false),
			);
			prebid.initialise(window, mockConsentState);
			expect(window.pbjs?.bidderSettings.magnite).toBeUndefined();
		});
	});

	test('should generate correct Prebid config when user-sync off', () => {
		window.guardian.config.switches.prebidUserSync = false;
		prebid.initialise(window, mockConsentState);
		// @ts-expect-error -- it works with the alternative type
		expect(window.pbjs?.getConfig().userSync.syncEnabled).toEqual(false);
	});
});

type BidWonHandler = (arg0: {
	height: number;
	width: number;
	adUnitCode: string;
}) => void;

describe('Prebid.js bidWon Events', () => {
	test('should respond for correct configuration', () => {
		let bidWonEventName;
		let bidWonEventHandler: BidWonHandler;
		const dummyAdvert = {
			size: [200, 200],
			hasPrebidSize: false,
		};

		if (!window.pbjs) return;
		window.pbjs.onEvent = jest.fn((eventName, eventHandler) => {
			bidWonEventName = eventName;
			bidWonEventHandler = eventHandler;
		});

		getAdvertById.mockImplementation(() => dummyAdvert);

		prebid.initialise(window, mockConsentState);

		expect(bidWonEventName).toBe('bidWon');
		expect(window.pbjs.onEvent).toHaveBeenCalledTimes(1);

		// @ts-expect-error -- this is handled by onEvent
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it used to be that way
		if (bidWonEventHandler) {
			bidWonEventHandler({
				height: 100,
				width: 100,
				adUnitCode: 'foo',
			});
		}

		expect(getAdvertById).toHaveBeenCalledTimes(1);
		expect(getAdvertById).toHaveBeenCalledWith('foo');
		expect(dummyAdvert.size).toMatchObject([100, 100]);
		expect(dummyAdvert.hasPrebidSize).toBe(true);
	});

	test.each([
		[
			'height',
			{
				width: 100,
				adUnitCode: 'foo',
			},
		],
		[
			'width',
			{
				height: 100,
				adUnitCode: 'foo',
			},
		],
		[
			'adUnitCode',
			{
				width: 100,
				height: 100,
			},
		],
	])('should not respond if %s is missing from prebid data', (_, data) => {
		let bidWonEventName;
		let bidWonEventHandler: BidWonHandler;

		if (!window.pbjs) return false;
		window.pbjs.onEvent = jest.fn((eventName, eventHandler) => {
			bidWonEventName = eventName;
			bidWonEventHandler = eventHandler;
		});

		prebid.initialise(window, mockConsentState);

		expect(bidWonEventName).toBe('bidWon');
		expect(window.pbjs.onEvent).toHaveBeenCalledTimes(1);

		// @ts-expect-error -- this is handled by onEvent
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it used to be that way
		if (bidWonEventHandler) {
			// @ts-expect-error -- we’re testing malformed data
			bidWonEventHandler(data);
		}

		expect(getAdvertById).not.toHaveBeenCalled();
	});
});
