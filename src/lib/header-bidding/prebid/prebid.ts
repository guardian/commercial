import type { AdSize } from '@guardian/commercial/ad-sizes';
import { createAdSize } from '@guardian/commercial/ad-sizes';
import { PREBID_TIMEOUT } from '@guardian/commercial/constants/prebid-timeout';
import { EventTimer } from '@guardian/commercial/event-timer';
import { getPermutiveSegments } from '@guardian/commercial/permutive';
import type { PageTargeting } from '@guardian/commercial/targeting/build-page-targeting';
import { getConsentFor, isString, log, onConsent } from '@guardian/libs';
import type { ConsentState } from '@guardian/libs';
import { flatten } from 'lodash-es';
import type { PrebidPriceGranularity } from 'prebid.js/src/cpmBucketManager';
import type { Advert } from '../../../define/Advert';
import { getParticipations } from '../../../experiments/ab';
import { pubmatic } from '../../__vendor/pubmatic';
import { getAdvertById } from '../../dfp/get-advert-by-id';
import { isUserLoggedIn } from '../../identity/api';
import { getPageTargeting } from '../../page-targeting';
import type {
	AnalyticsConfig,
	BidderCode,
	HeaderBiddingSlot,
	PrebidBid,
	PrebidEvent,
	PrebidMediaTypes,
	SlotFlatMap,
} from '../prebid-types';
import { getHeaderBiddingAdSlots } from '../slot-config';
import {
	isSwitchedOn,
	shouldIncludeBidder,
	shouldIncludePermutive,
	stripDfpAdPrefixFrom,
} from '../utils';
import { bids } from './bid-config';
import { overridePriceBucket, priceGranularity } from './price-config';

type CmpApi = 'iab' | 'static';
/** @see https://docs.prebid.org/dev-docs/modules/consentManagementTcf.html */
type GDPRConfig = {
	cmpApi: CmpApi;
	timeout: number;
	defaultGdprScope: boolean;
	allowAuctionWithoutConsent?: never;
	consentData?: Record<string, unknown>;
};

/** @see https://docs.prebid.org/dev-docs/modules/consentManagementUsp.html */
type USPConfig = {
	cmpApi: CmpApi;
	timeout: number;
	consentData?: Record<string, unknown>;
};

type ConsentManagement =
	| {
			gdpr: GDPRConfig;
	  }
	| {
			usp: USPConfig;
	  }
	| {
			gpp: USPConfig;
	  };

type UserId = {
	name: string;
	params?: Record<string, string | number>;
	storage: {
		type: 'cookie' | 'html5';
		name: string;
		expires: number;
		refreshInSeconds?: number;
	};
};

type UserSync =
	| {
			syncsPerBidder: number;
			filterSettings: {
				all: {
					bidders: string;
					filter: string;
				};
			};
			userIds: UserId[];
	  }
	| {
			syncEnabled: false;
	  };

type PbjsConfig = {
	bidderTimeout: number;
	timeoutBuffer?: number;
	priceGranularity: PrebidPriceGranularity;
	userSync: UserSync;
	ortb2?: {
		site?: {
			ext: {
				data: {
					keywords: string[];
				};
			};
		};
		user?: {
			ext: {
				data: {
					permutive?: string[];
				};
			};
		};
	};
	consentManagement?: ConsentManagement;
	realTimeData?: unknown;
	useBidCache?: boolean;
	customPriceBucket?: PrebidPriceGranularity;
	/**
	 * This is a custom property that has been added to our fork of prebid.js
	 * to select a price bucket based on the width and height of the slot.
	 */
	guCustomPriceBucket?: (bid: {
		width: number;
		height: number;
	}) => PrebidPriceGranularity | undefined;
};

type PbjsBidderConfig = Pick<
	PbjsConfig,
	'customPriceBucket' | 'guCustomPriceBucket' | 'ortb2'
>;

type PbjsEvent = 'bidWon';
/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/getBidResponses.html */
type PbjsEventData = {
	width: number;
	height: number;
	adUnitCode: string;
	bidderCode?: BidderCode;
	statusMessage?: string;
	adId?: string;
	creative_id?: number;
	cpm?: number;
	adUrl?: string;
	requestTimestamp?: number;
	responseTimestamp?: number;
	timeToRespond?: number;
	bidder?: string;
	usesGenericKeys?: boolean;
	size?: string;
	adserverTargeting?: Record<string, unknown>;
	[x: string]: unknown;
};
type PbjsEventHandler = (data: PbjsEventData) => void;

type BidResponse = {
	bidder: BidderCode;
	width: number;
	height: number;
	pbCg: string;
	cpm: number;
	adId: string;
	source: string;
	mediaType: string;
	size: string;
	bidderCode: string;
	[x: string]: unknown;
};

// bidResponse expected types. Check with advertisers
type XaxisBidResponse = {
	appnexus?: {
		buyerMemberId?: string;
	};
	[x: string]: unknown;
};

type BuyerTargeting<T> = {
	key: string;
	val: (bidResponse: T) => string | null | undefined;
};

/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/bidderSettings.html */
type BidderSetting<T = BidResponse> = {
	adserverTargeting: Array<BuyerTargeting<T>>;
	bidCpmAdjustment: (n: number) => number;
	suppressEmptyKeys: boolean;
	sendStandardTargeting: boolean;
	storageAllowed: boolean;
};

type BidderSettings = Partial<
	Record<Exclude<BidderCode, 'xhb'> | 'magnite', Partial<BidderSetting>>
> & {
	standard?: never; // prevent overriding the default settings
	xhb?: Partial<BidderSetting<XaxisBidResponse>>;
};

class PrebidAdUnit {
	code: string | null | undefined;
	bids: PrebidBid[] | null | undefined;
	mediaTypes: PrebidMediaTypes | null | undefined;
	gpid?: string;
	ortb2Imp?: {
		ext: {
			gpid: string;
			data: {
				pbadslot: string;
			};
		};
	};

	constructor(
		advert: Advert,
		slot: HeaderBiddingSlot,
		pageTargeting: PageTargeting,
		consentState: ConsentState,
	) {
		this.code = advert.id;
		this.mediaTypes = { banner: { sizes: slot.sizes } };
		this.gpid = this.generateGpid(advert, slot);
		this.ortb2Imp = {
			ext: {
				gpid: this.gpid,
				data: {
					pbadslot: this.gpid,
				},
			},
		};

		this.bids = bids(
			advert.id,
			slot.sizes,
			pageTargeting,
			this.gpid,
			consentState,
		);

		advert.headerBiddingSizes = slot.sizes;
		log('commercial', `PrebidAdUnit ${this.code}`, this.bids);
	}

	isEmpty() {
		return this.code == null;
	}
	private generateGpid(advert: Advert, slot: HeaderBiddingSlot): string {
		const sectionName = window.guardian.config.page.section;
		const contentType = window.guardian.config.page.contentType;
		const slotName = slot.key;
		return `/59666047/gu/${sectionName}/${contentType}/${slotName}`;
	}
}

declare global {
	interface Window {
		pbjs?: {
			que: {
				push: (cb: () => void) => void;
			};
			addAdUnits: (adUnits: PrebidAdUnit[]) => void;
			/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/requestBids.html */
			requestBids(requestObj?: {
				adUnitCodes?: string[];
				adUnits?: PrebidAdUnit[];
				timeout?: number;
				bidsBackHandler?: (
					bidResponses: unknown,
					timedOut: boolean,
					auctionId: string,
				) => void;
				labels?: string[];
				auctionId?: string;
			}): void;
			setConfig: (config: PbjsConfig) => void;
			setBidderConfig: (bidderConfig: {
				bidders: BidderCode[];
				config: PbjsBidderConfig;
			}) => void;
			getConfig: (item?: string) => PbjsConfig & {
				dataProviders: Array<{
					name: string;
					params: {
						acBidders: BidderCode[];
					};
				}>;
			};
			bidderSettings: BidderSettings;
			enableAnalytics: (arg0: [AnalyticsConfig]) => void;
			onEvent: (event: PbjsEvent, handler: PbjsEventHandler) => void;
			setTargetingForGPTAsync: (
				codeArr?: string[],
				customSlotMatching?: (slot: unknown) => unknown,
			) => void;
			getEvents: () => PrebidEvent[];
		};
	}
}

const shouldEnableAnalytics = (): boolean => {
	if (!window.guardian.config.switches.prebidAnalytics) {
		return false;
	}

	const analyticsSampleRate = 10 / 100;
	const isInSample = Math.random() < analyticsSampleRate;

	const isInServerSideTest =
		Object.keys(window.guardian.config.tests ?? {}).length > 0;
	const isInClientSideTest = Object.keys(getParticipations()).length > 0;

	const hasQueryParam = window.location.search.includes(
		'pbjs-analytics=true',
	);
	return (
		isInServerSideTest || isInClientSideTest || isInSample || hasQueryParam
	);
};

/**
 * Prebid supports an additional timeout buffer to account for noisiness in
 * timing JavaScript on the page. This value is passed to the Prebid config
 * and is adjustable via this constant
 */
const timeoutBuffer = 400;

/**
 * The amount of time reserved for the auction
 */
const bidderTimeout = PREBID_TIMEOUT;

let requestQueue: Promise<void> = Promise.resolve();
let initialised = false;

const initialise = (window: Window, consentState: ConsentState): void => {
	if (!window.pbjs) {
		log('commercial', 'window.pbjs not found on window');
		return; // We couldn’t initialise
	}
	initialised = true;

	const userIds: UserId[] = [
		{
			name: 'sharedId',
			storage: {
				type: 'cookie',
				name: '_pubcid',
				expires: 365,
			},
		},
	];

	if (getConsentFor('id5', consentState)) {
		userIds.push({
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
		});
	}

	const userSync: UserSync = isSwitchedOn('prebidUserSync')
		? {
				syncsPerBidder: 0, // allow all syncs
				filterSettings: {
					all: {
						bidders: '*', // allow all bidders to sync by iframe or image beacons
						filter: 'include',
					},
				},
				userIds,
			}
		: { syncEnabled: false };

	const consentManagement = (): ConsentManagement => {
		switch (consentState.framework) {
			/** @see https://docs.prebid.org/dev-docs/modules/consentManagementUsp.html */
			case 'aus':
				return {
					usp: {
						cmpApi: 'iab',
						timeout: 1500,
					},
				};
			/** @see https://docs.prebid.org/dev-docs/modules/consentManagementGpp.html */
			case 'usnat':
				return {
					gpp: {
						cmpApi: 'iab',
						timeout: 1500,
					},
				};
			/** @see https://docs.prebid.org/dev-docs/modules/consentManagementTcf.html */
			case 'tcfv2':
			default:
				return {
					gdpr: {
						cmpApi: 'iab',
						timeout: 200,
						defaultGdprScope: true,
					},
				};
		}
	};

	/** Helper function to decide if a bidder should be included.
	 * It is a curried function prepared with the consent state
	 * at the time of initialisation to avoid unnecessary repetition
	 * of consent state throughout */
	const shouldInclude = shouldIncludeBidder(consentState);

	const pbjsConfig: PbjsConfig = Object.assign(
		{},
		{
			bidderTimeout,
			timeoutBuffer,
			priceGranularity,
			userSync,
			useBidCache: isSwitchedOn('prebidBidCache'),
		},
	);

	const keywordsArray = window.guardian.config.page.keywords.split(',');

	pbjsConfig.ortb2 = {
		site: {
			ext: {
				data: {
					keywords: keywordsArray,
				},
			},
		},
	};

	window.pbjs.bidderSettings = {};

	if (isSwitchedOn('consentManagement')) {
		pbjsConfig.consentManagement = consentManagement();
	}

	if (shouldIncludePermutive(consentState)) {
		const includedAcBidders = (
			['and', 'ix', 'ozone', 'pubmatic', 'trustx'] satisfies BidderCode[]
		)
			.filter(shouldInclude)
			// "and" is the alias for the custom Guardian "appnexus" direct bidder
			.map((bidder) => (bidder === 'and' ? 'appnexus' : bidder));

		pbjsConfig.realTimeData = {
			dataProviders: [
				{
					name: 'permutive',
					params: {
						acBidders: includedAcBidders,
						...(includedAcBidders.includes('pubmatic')
							? { overwrites: { pubmatic } }
							: {}),
					},
				},
			],
		};
	}

	if (shouldInclude('criteo')) {
		window.pbjs.bidderSettings.criteo = {
			storageAllowed: true,
			// Use a custom price granularity, which is based upon the size of the slot being auctioned
			adserverTargeting: [
				{
					key: 'hb_pb',
					val({ width, height, cpm, pbCg }) {
						return overridePriceBucket(
							'criteo',
							width,
							height,
							cpm,
							pbCg,
						);
					},
				},
			],
		};
	}

	if (shouldInclude('ozone')) {
		// Use a custom price granularity, which is based upon the size of the slot being auctioned
		window.pbjs.bidderSettings.ozone = {
			adserverTargeting: [
				{
					key: 'hb_pb',
					val: ({ width, height, cpm, pbCg }) => {
						return overridePriceBucket(
							'ozone',
							width,
							height,
							cpm,
							pbCg,
						);
					},
				},
			],
		};
	}

	if (shouldInclude('ix')) {
		// Use a custom price granularity, which is based upon the size of the slot being auctioned
		window.pbjs.bidderSettings.ix = {
			adserverTargeting: [
				{
					key: 'hb_pb',
					val({ width, height, cpm, pbCg }) {
						return overridePriceBucket(
							'ix',
							width,
							height,
							cpm,
							pbCg,
						);
					},
				},
			],
		};
	}

	if (shouldEnableAnalytics() && window.guardian.ophan?.pageViewId) {
		window.pbjs.enableAnalytics([
			{
				provider: 'gu',
				options: {
					url:
						window.guardian.config.page.isDev ||
						window.location.hostname.includes('localhost')
							? `//performance-events.code.dev-guardianapis.com/header-bidding`
							: `//performance-events.guardianapis.com/header-bidding`,
					pv: window.guardian.ophan.pageViewId,
				},
			},
		]);
	}

	if (shouldInclude('xhb')) {
		window.pbjs.bidderSettings.xhb = {
			adserverTargeting: [
				{
					key: 'hb_buyer_id',
					val(bidResponse) {
						// TODO: should we return null or an empty string?
						return bidResponse.appnexus?.buyerMemberId ?? '';
					},
				},
			],
			bidCpmAdjustment: (bidCpm: number) => {
				return bidCpm * 1.05;
			},
		};
	}

	if (shouldInclude('kargo')) {
		window.pbjs.bidderSettings.kargo = {
			storageAllowed: true,
		};
	}

	if (shouldInclude('rubicon')) {
		window.pbjs.bidderSettings.magnite = {
			storageAllowed: true,
		};

		window.pbjs.setBidderConfig({
			bidders: ['rubicon'],
			config: {
				ortb2: {
					user: {
						ext: {
							data: {
								permutive: getPermutiveSegments(),
							},
						},
					},
				},
			},
		});
	}

	window.pbjs.setConfig(pbjsConfig);

	// Adjust slot size when prebid ad loads
	window.pbjs.onEvent('bidWon', (data) => {
		const { width, height, adUnitCode } = data;

		if (!width || !height || !adUnitCode) {
			return;
		}

		const size: AdSize = createAdSize(width, height); // eg. [300, 250]
		const advert = getAdvertById(adUnitCode);

		if (!advert) {
			return;
		}

		advert.size = size;
		/**
		 * when hasPrebidSize is true we use size
		 * set here when adjusting the slot size.
		 * */
		advert.hasPrebidSize = true;
	});
};

const bidsBackHandler = (
	adUnits: PrebidAdUnit[],
	eventTimer: EventTimer,
): Promise<void> =>
	new Promise((resolve) => {
		window.pbjs?.setTargetingForGPTAsync(
			adUnits.map((u) => u.code).filter(isString),
		);

		resolve();

		adUnits.forEach((adUnit) => {
			if (isString(adUnit.code)) {
				eventTimer.mark('prebidEnd', stripDfpAdPrefixFrom(adUnit.code));
			}
		});
	});

// slotFlatMap allows you to dynamically interfere with the PrebidSlot definition
// for this given request for bids.
const requestBids = async (
	adverts: Advert[],
	slotFlatMap?: SlotFlatMap,
): Promise<void> => {
	if (!initialised) {
		return requestQueue;
	}

	if (!window.guardian.config.switches.prebidHeaderBidding) {
		return requestQueue;
	}

	const adUnits = await onConsent()
		.then(async (consentState) => {
			// calculate this once before mapping over
			const isSignedIn = await isUserLoggedIn();
			const pageTargeting = getPageTargeting(consentState, isSignedIn);
			return flatten(
				adverts.map((advert) =>
					getHeaderBiddingAdSlots(advert, slotFlatMap)
						.map(
							(slot) =>
								new PrebidAdUnit(
									advert,
									slot,
									pageTargeting,
									consentState,
								),
						)
						.filter((adUnit) => !adUnit.isEmpty()),
				),
			);
		})
		.catch((e) => {
			// silently fail
			log('commercial', 'Failed to execute prebid onConsent', e);
			return [];
		});

	const eventTimer = EventTimer.get();

	requestQueue = requestQueue.then(
		() =>
			new Promise<void>((resolve) => {
				adUnits.forEach((adUnit) => {
					if (isString(adUnit.code)) {
						eventTimer.mark(
							'prebidStart',
							stripDfpAdPrefixFrom(adUnit.code),
						);
					}
				});
				window.pbjs?.que.push(() => {
					window.pbjs?.requestBids({
						adUnits,
						bidsBackHandler: () =>
							void bidsBackHandler(adUnits, eventTimer).then(
								resolve,
							),
					});
				});
			}),
	);
	return requestQueue;
};

export const prebid = { initialise, requestBids };
