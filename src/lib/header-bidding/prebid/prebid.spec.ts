import { getAdvertById as getAdvertById_ } from '../../dfp/get-advert-by-id';
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

const resetPrebid = () => {
	delete window.pbjs;
	// @ts-expect-error -- there’s no types for this
	delete window.pbjsChunk;
	jest.resetModules();
	jest.requireActual('@guardian/prebid.js/build/dist/prebid');
};

describe('initialise', () => {
	beforeEach(() => {
		resetPrebid();
		window.guardian.config.switches.consentManagement = true;
		window.guardian.config.switches.prebidUserSync = true;
		window.guardian.config.switches.prebidAppNexus = true;
		window.guardian.config.switches.prebidXaxis = true;
		getAdvertById.mockReset();
	});

	test('should generate correct Prebid config when all switches on', () => {
		prebid.initialise(window, 'tcfv2');
		expect(window.pbjs?.getConfig()).toEqual({
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
			useBidCache: false,
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
				],
				auctionDelay: 500,
				filterSettings: {
					all: {
						bidders: '*',
						filter: 'include',
					},
				},
			},
		});
	});

	test('should generate correct Prebid config consent management in USNAT', () => {
		prebid.initialise(window, 'usnat');
		expect(window.pbjs?.getConfig('consentManagement')).toEqual({
			gpp: {
				cmpApi: 'iab',
				timeout: 1500,
			},
		});
	});

	test('should generate correct Prebid config consent management in AUS', () => {
		prebid.initialise(window, 'aus');
		expect(window.pbjs?.getConfig('consentManagement')).toEqual({
			usp: {
				cmpApi: 'iab',
				timeout: 1500,
			},
		});
	});

	test('should generate correct Prebid config when consent management off', () => {
		window.guardian.config.switches.consentManagement = false;
		prebid.initialise(window);
		expect(window.pbjs?.getConfig('consentManagement')).toBeUndefined();
	});

	test('should generate correct bidder settings', () => {
		prebid.initialise(window);
		expect(window.pbjs?.bidderSettings.xhb).toHaveProperty(
			'adserverTargeting',
		);
	});

	describe('bidderSettings', () => {
		beforeEach(() => {
			window.guardian.config.switches.prebidXaxis = false;
			window.guardian.config.switches.prebidImproveDigital = false;
		});

		test('should generate correct bidder settings when bidder switches are off', () => {
			prebid.initialise(window);
			expect(window.pbjs?.bidderSettings).toEqual({});
		});

		test('should generate correct bidder settings when Xaxis is on', () => {
			window.guardian.config.switches.prebidXaxis = true;
			prebid.initialise(window);
			expect(window.pbjs?.bidderSettings).toHaveProperty('xhb');
		});

		test('should generate correct bidder settings when Improve Digital is on', () => {
			window.guardian.config.switches.prebidImproveDigital = true;
			prebid.initialise(window);
			expect(window.pbjs?.bidderSettings).toHaveProperty(
				'improvedigital',
			);
		});
	});

	test('should generate correct Prebid config when user-sync off', () => {
		window.guardian.config.switches.prebidUserSync = false;
		prebid.initialise(window);
		// @ts-expect-error -- it works with the alternative type
		expect(window.pbjs?.getConfig().userSync.syncEnabled).toEqual(false);
	});

	test('should generate correct Prebid config when both Permutive and prebidPermutiveAudience are true', () => {
		window.guardian.config.switches.permutive = true;
		window.guardian.config.switches.prebidPermutiveAudience = true;
		prebid.initialise(window);
		const rtcData = window.pbjs?.getConfig('realTimeData').dataProviders[0];
		expect(rtcData?.name).toEqual('permutive');
		expect(rtcData?.params.acBidders).toEqual([
			'appnexus',
			'ix',
			'ozone',
			'pubmatic',
			'trustx',
		]);
	});

	test.each([
		[true, false],
		[false, true],
		[false, false],
	])(
		'should not generate RTD when Permutive is %s and prebidPermutiveAudience is %s',
		(p, a) => {
			window.guardian.config.switches.permutive = p;
			window.guardian.config.switches.prebidPermutiveAudience = a;
			prebid.initialise(window);
			const rtcData = window.pbjs?.getConfig('realTimeData');
			expect(rtcData).toBeUndefined();
		},
	);

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

			prebid.initialise(window);

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
		])(
			'should not respond if %s is missing from prebid data',
			(_, data) => {
				let bidWonEventName;
				let bidWonEventHandler: BidWonHandler;

				if (!window.pbjs) return false;
				window.pbjs.onEvent = jest.fn((eventName, eventHandler) => {
					bidWonEventName = eventName;
					bidWonEventHandler = eventHandler;
				});

				prebid.initialise(window);

				expect(bidWonEventName).toBe('bidWon');
				expect(window.pbjs.onEvent).toHaveBeenCalledTimes(1);

				// @ts-expect-error -- this is handled by onEvent
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it used to be that way
				if (bidWonEventHandler) {
					// @ts-expect-error -- we’re testing malformed data
					bidWonEventHandler(data);
				}

				expect(getAdvertById).not.toHaveBeenCalled();
			},
		);
	});
});
