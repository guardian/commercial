import type { ConsentState } from '@guardian/libs';
import { getConsentFor, loadScript, onConsent } from '@guardian/libs';
import type * as AdSizesType from 'core/ad-sizes';
import { commercialFeatures } from 'lib/commercial-features';
import _config from 'lib/config';
import { getCurrentBreakpoint as getCurrentBreakpoint_ } from 'lib/detect/detect-breakpoint';
import { loadAdvert } from '../../display/load-advert';
import { dfpEnv } from '../../lib/dfp/dfp-env';
import { init as prepareGoogletag } from './prepare-googletag';
import { fillStaticAdvertSlots } from './static-ad-slots';

const config = _config as {
	get: (k: string) => string;
	set: (
		k: string,
		v:
			| boolean
			| string
			| Record<string, never>
			| {
					adUnit: string;
					contentType: string;
					edition: string;
					isFront: boolean;
					keywordIds: string;
					pageId: string;
					section: string;
					seriesId: string;
					sharedAdTargeting: {
						ct: string;
						edition: string;
						k: string[];
						se: string[];
					};
			  },
	) => void;
};

const getAdverts = (withEmpty: boolean) => {
	return [...dfpEnv.adverts.values()].map((advert) => {
		// Do not return empty slots unless explicitly requested
		if (withEmpty || !advert.isEmpty) {
			return advert;
		}
		return null;
	});
};

const getCurrentBreakpoint = getCurrentBreakpoint_ as jest.MockedFunction<
	typeof getCurrentBreakpoint_
>;

jest.mock('define/init-slot-ias', () => ({
	initSlotIas: jest.fn(() => Promise.resolve()),
}));

jest.mock('lib/header-bidding/prebid/prebid', () => ({
	requestBids: jest.fn(),
}));

jest.mock('lib/identity/api', () => ({
	isUserLoggedInOktaRefactor: () => true,
	getUserFromCookie: jest.fn(),
	getGoogleTagId: jest.fn().mockResolvedValue('test-id-string'),
	getUrl: jest.fn(),
}));
jest.mock('@guardian/ophan-tracker-js', () => null);
jest.mock('lib/analytics/beacon', () => void {});

jest.mock('lib/detect/detect-breakpoint', () => ({
	getCurrentBreakpoint: jest.fn(),
	hasCrossedBreakpoint: jest.fn(),
}));
jest.mock('lib/analytics/google', () => () => void {});
jest.mock('display/display-lazy-ads', () => ({
	displayLazyAds: jest.fn(),
}));

jest.mock('core/ad-sizes', () => {
	const adSizes: typeof AdSizesType = jest.requireActual('core/ad-sizes');
	const { createAdSize } = adSizes;
	return {
		...adSizes,
		slotSizeMappings: {
			'html-slot': {
				mobile: [Array.from(createAdSize(300, 50))],
			},
			'script-slot': {
				mobile: [
					Array.from(createAdSize(300, 50)),
					Array.from(createAdSize(320, 50)),
				],
			},
			'already-labelled': {
				mobile: [
					Array.from(createAdSize(300, 50)),
					Array.from(createAdSize(320, 50)),
				],
				tablet: [Array.from(createAdSize(728, 90))],
			},
			'dont-label': {
				mobile: [
					Array.from(createAdSize(300, 50)),
					Array.from(createAdSize(320, 50)),
				],
				tablet: [Array.from(createAdSize(728, 90))],
				desktop: [
					Array.from(createAdSize(728, 90)),
					Array.from(createAdSize(900, 250)),
					Array.from(createAdSize(970, 250)),
				],
			},
		},
	};
});

jest.mock('@guardian/libs', () => {
	return {
		// eslint-disable-next-line -- ESLint doesn't understand jest.requireActual
		...jest.requireActual<typeof import('@guardian/libs')>(
			'@guardian/libs',
		),
		loadScript: jest.fn(() => Promise.resolve()),
		onConsent: jest.fn(),
		getConsentFor: jest.fn(),
		cmp: {
			hasInitialised: jest.fn(),
			willShowPrivacySync: jest.fn(),
		},
	};
});
jest.mock(
	'lodash-es/once',
	() =>
		<T>(fn: (...args: unknown[]) => T) =>
			fn,
);
jest.mock('lib/analytics/beacon', () => ({
	fire: jest.fn(),
}));
jest.mock('display/load-advert', () => ({
	loadAdvert: jest.fn(),
}));

jest.mock('./prepare-prebid', () => ({
	setupPrebidOnce: jest
		.fn()
		.mockImplementation(() => Promise.resolve(undefined)),
}));

const mockOnConsent = (consentState: ConsentState) =>
	(onConsent as jest.Mock).mockReturnValueOnce(Promise.resolve(consentState));

const mockGetConsentFor = (hasConsent: boolean) =>
	(getConsentFor as jest.Mock).mockReturnValueOnce(hasConsent);

let $style: HTMLElement;
const makeFakeEvent = (
	creativeId: number,
	id: string,
): DeepPartial<googletag.events.SlotRenderEndedEvent> => ({
	creativeId,
	slot: {
		getSlotElementId() {
			return id;
		},
	},
	size: [300, 250],
});

const reset = () => {
	dfpEnv.adverts = new Map();
	dfpEnv.advertsToLoad = [];
	window.guardian.config.switches = {
		prebidHeaderBidding: false,
		a9HeaderBidding: false,
	};
};

const tcfv2WithConsent: ConsentState = {
	tcfv2: {
		consents: {
			'1': true,
			'2': true,
			'3': true,
			'4': true,
			'5': true,
			'6': true,
			'7': true,
			'8': true,
			'9': true,
			'10': true,
		},
		vendorConsents: {
			'5f1aada6b8e05c306c0597d7': true, // Googletag
		},
		eventStatus: 'tcloaded',
		addtlConsent: 'unknown',
		gdprApplies: true,
		tcString: 'BOGUS.YAA',
	},
	canTarget: true,
	framework: 'tcfv2',
};

const ausNotRejected: ConsentState = {
	aus: { personalisedAdvertising: true },
	canTarget: true,
	framework: 'aus',
};

const ausRejected: ConsentState = {
	aus: { personalisedAdvertising: false },
	canTarget: false,
	framework: 'aus',
};

const ccpaWithConsent: ConsentState = {
	ccpa: { doNotSell: false, signalStatus: 'ready' },
	canTarget: true,
	framework: 'ccpa',
};

const ccpaWithoutConsent: ConsentState = {
	ccpa: { doNotSell: true, signalStatus: 'ready' },
	canTarget: false,
	framework: 'ccpa',
};

describe('DFP', () => {
	const domSnippet = `
        <div id="dfp-ad-html-slot" class="js-ad-slot" data-name="html-slot"></div>
        <div id="dfp-ad-script-slot" class="js-ad-slot" data-name="script-slot" data-refresh="false"></div>
        <div id="dfp-ad-already-labelled" class="js-ad-slot ad-label--showing" data-name="already-labelled"></div>
        <div id="dfp-ad-dont-label" class="js-ad-slot" data-label="false" data-name="dont-label"></div>
    `;

	let googleTag: typeof googletag;
	let googleSlot: googletag.Slot;
	let pubAds: googletag.PubAdsService;
	let sizeMapping: googletag.SizeMappingBuilder;

	const listeners: {
		impressionViewable?: (
			event: googletag.events.ImpressionViewableEvent,
		) => void;
		slotOnload?: (event: googletag.events.SlotOnloadEvent) => void;
		slotRenderEnded?: (
			event: googletag.events.SlotRenderEndedEvent,
		) => void;
		slotRequested?: (event: googletag.events.SlotRequestedEvent) => void;
		slotResponseReceived?: (
			event: googletag.events.SlotResponseReceived,
		) => void;
		slotVisibilityChanged?: (
			event: googletag.events.SlotVisibilityChangedEvent,
		) => void;
	} = {} as const;

	beforeEach(() => {
		config.set('page', {
			adUnit: '/123456/theguardian.com/front',
			contentType: 'Article',
			edition: 'us',
			isFront: true,
			keywordIds: 'world/korea,world/ukraine',
			pageId: 'world/uk',
			section: 'news',
			seriesId: 'learning/series/happy-times',
			sharedAdTargeting: {
				ct: 'Article',
				edition: 'us',
				k: ['korea', 'ukraine'],
				se: ['happy-times'],
			},
		});

		document.body.innerHTML = domSnippet;

		$style = document.createElement('style');
		$style.innerHTML = `body:after{ content: "wide"}`;
		document.head.appendChild($style);

		pubAds = {
			// @ts-expect-error - it is a mock
			listeners: listeners,
			addEventListener: jest.fn((eventType, listener) => {
				// @ts-expect-error - it is a mock
				listeners[eventType] = listener;
				return pubAds;
			}),
			setTargeting: jest.fn(),
			enableSingleRequest: jest.fn(),
			collapseEmptyDivs: jest.fn(),
			refresh: jest.fn(),
			setRequestNonPersonalizedAds: jest.fn(),
			setPrivacySettings: jest.fn(),
			setPublisherProvidedId: jest.fn(),
		};

		let sizesArray: googletag.SizeMappingArray = [];

		sizeMapping = {
			sizes: sizesArray,
			addSize: jest.fn((width, sizes) => {
				sizesArray.unshift([width, sizes]);
			}),
			build: jest.fn(() => {
				const tmp = sizesArray;
				sizesArray = [];
				return tmp;
			}),
		} as unknown as googletag.SizeMappingBuilder;

		googleSlot = {
			defineSizeMapping: jest.fn(() => googleSlot),
			setSafeFrameConfig: jest.fn(() => googleSlot),
			setTargeting: jest.fn(() => googleSlot),
			addService: jest.fn(() => googleSlot),
			getTargeting: jest.fn(() => []),
		} as unknown as googletag.Slot;

		googleTag = {
			cmd: {
				push(...args: Array<() => void>) {
					args.forEach((command) => {
						command();
					});
					return args.length;
				},
			},
			pubads() {
				return pubAds;
			},
			sizeMapping() {
				return sizeMapping;
			},
			defineSlot: jest.fn(() => googleSlot),
			defineOutOfPageSlot: jest.fn(() => googleSlot),
			enableServices: jest.fn(),
			display: jest.fn(),
		} as unknown as typeof googletag;

		window.googletag = googleTag;
		(
			window as unknown as {
				__switch_zero: boolean;
			}
		).__switch_zero = false;

		commercialFeatures.shouldLoadGoogletag = true;
	});

	afterEach(() => {
		reset();
		document.body.innerHTML = '';
		$style.remove();
		// @ts-expect-error -- we’re removing it
		window.googletag = undefined;
	});

	it('hides all ad slots when all DFP advertising is disabled', async () => {
		commercialFeatures.shouldLoadGoogletag = false;
		await prepareGoogletag();
		const remainingAdSlots = document.querySelectorAll('.js-ad-slot');
		expect(remainingAdSlots.length).toBe(0);
	});

	it('should get the slots', async () => {
		expect.hasAssertions();

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		expect(Object.keys(getAdverts(true)).length).toBe(4);
	});

	it('should not get hidden ad slots', async () => {
		const adSlot = document.querySelector<HTMLElement>('.js-ad-slot');
		if (adSlot) {
			adSlot.style.display = 'none';
		}
		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		const slots = getAdverts(true);
		expect(Object.keys(slots).length).toBe(3);
		Object.keys(slots).forEach((slotId) => {
			expect(slotId).toBeTruthy();
			expect(slotId).not.toBe('dfp-ad-html-slot');
		});
	});

	it('should define slots', async () => {
		expect.hasAssertions();

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		[
			[
				'dfp-ad-html-slot',
				[[300, 50]],
				[[[0, 0], [[300, 50]]]],
				'html-slot',
			],
			[
				'dfp-ad-script-slot',
				[
					[300, 50],
					[320, 50],
				],
				[
					[
						[0, 0],
						[
							[300, 50],
							[320, 50],
						],
					],
				],
				'script-slot',
			],
			[
				'dfp-ad-already-labelled',
				[
					[728, 90],
					[300, 50],
					[320, 50],
				],
				[
					[[740, 0], [[728, 90]]],
					[
						[0, 0],
						[
							[300, 50],
							[320, 50],
						],
					],
				],
				'already-labelled',
			],
			[
				'dfp-ad-dont-label',
				[
					[728, 90],
					[900, 250],
					[970, 250],
					[300, 50],
					[320, 50],
				],
				[
					[
						[980, 0],
						[
							[728, 90],
							[900, 250],
							[970, 250],
						],
					],
					[[740, 0], [[728, 90]]],
					[
						[0, 0],
						[
							[300, 50],
							[320, 50],
						],
					],
				],
				'dont-label',
			],
		].forEach((data) => {
			expect(window.googletag.defineSlot).toHaveBeenCalledWith(
				'/123456/theguardian.com/front',
				data[1],
				data[0],
			);
			expect(googleSlot.addService).toHaveBeenCalledWith(pubAds);
			if (Array.isArray(data[2])) {
				data[2].forEach((size) => {
					expect(sizeMapping.addSize).toHaveBeenCalledWith(
						size[0],
						size[1],
					);
				});
			}
			expect(googleSlot.defineSizeMapping).toHaveBeenCalledWith(data[2]);
			expect(googleSlot.setTargeting).toHaveBeenCalledWith(
				'slot',
				data[3],
			);
		});
	});

	it('should display ads', async () => {
		window.guardian.config.page.hasPageSkin = true;
		getCurrentBreakpoint.mockReturnValue('wide');

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		expect(pubAds.enableSingleRequest).toHaveBeenCalled();
		expect(pubAds.collapseEmptyDivs).toHaveBeenCalled();
		expect(pubAds.setPublisherProvidedId).toHaveBeenCalledWith(
			'test-id-string',
		);
		expect(window.googletag.enableServices).toHaveBeenCalled();
		expect(loadAdvert).toHaveBeenCalled();
	});

	it('should be able to create "out of page" ad slot', async () => {
		document
			.querySelector('.js-ad-slot')
			?.setAttribute('data-out-of-page', 'true');

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		expect(window.googletag.defineOutOfPageSlot).toHaveBeenCalled();
	});

	it('should expose ads IDs', async () => {
		const fakeEventOne = makeFakeEvent(
			1,
			'dfp-ad-html-slot',
		) as googletag.events.SlotRenderEndedEvent;
		const fakeEventTwo = makeFakeEvent(
			2,
			'dfp-ad-script-slot',
		) as googletag.events.SlotRenderEndedEvent;

		mockOnConsent(tcfv2WithConsent);
		mockGetConsentFor(true);

		await fillStaticAdvertSlots();
		await prepareGoogletag();

		listeners.slotRenderEnded?.(fakeEventOne);
		listeners.slotRenderEnded?.(fakeEventTwo);
	});

	describe('keyword targeting', () => {
		it('should send page level keywords', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(true);
			await prepareGoogletag();
			expect(pubAds.setTargeting).toHaveBeenCalledWith('k', [
				'korea',
				'ukraine',
			]);
		});
	});

	describe('NPA flag in AUS', () => {
		it('when AUS consent is given', async () => {
			mockOnConsent(ausNotRejected);
			mockGetConsentFor(true);
			await prepareGoogletag();
			expect(pubAds.setPrivacySettings).toHaveBeenCalledWith({
				nonPersonalizedAds: false,
			});
		});
		it('when AUS consent is NOT given', async () => {
			mockOnConsent(ausRejected);
			mockGetConsentFor(false);
			await prepareGoogletag();
			expect(pubAds.setPrivacySettings).toHaveBeenCalledWith({
				nonPersonalizedAds: true,
			});
		});
	});
	describe('restrictDataProcessing flag in CCPA', () => {
		it('when CCPA consent is given', async () => {
			mockOnConsent(ccpaWithConsent);
			mockGetConsentFor(true);
			await prepareGoogletag();
			expect(pubAds.setPrivacySettings).toHaveBeenCalledWith({
				restrictDataProcessing: false,
			});
		});
		it('when CCPA consent is denied', async () => {
			mockOnConsent(ccpaWithoutConsent);
			mockGetConsentFor(false);
			await prepareGoogletag();
			expect(pubAds.setPrivacySettings).toHaveBeenCalledWith({
				restrictDataProcessing: true,
			});
		});
	});
	describe('load googletag', () => {
		beforeEach(() => {
			jest.clearAllMocks();
		});
		it('TCFV2 does load googletag when consent is given', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(true);
			await prepareGoogletag();
			expect(loadScript).toHaveBeenCalledTimes(1);
			expect(loadScript).toHaveBeenCalledWith(
				'//securepubads.g.doubleclick.net/tag/js/gpt.js',
				{ async: false },
			);
		});
		it('TCFV2 does NOT load when consent is NOT given', async () => {
			mockOnConsent(tcfv2WithConsent);
			mockGetConsentFor(false);
			await prepareGoogletag();
			expect(loadScript).toHaveBeenCalledTimes(0);
		});
	});
});
