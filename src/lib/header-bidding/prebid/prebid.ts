import type { ConsentFramework } from '@guardian/libs';
import { isString, log, onConsent } from '@guardian/libs';
import { flatten } from 'lodash-es';
import type { Advert } from '../../../define/Advert';
import { getParticipations, isUserInVariant } from '../../../experiments/ab';
import { prebidKeywords } from '../../../experiments/tests/prebid-keywords';
import type { AdSize } from '../../../lib/ad-sizes';
import { createAdSize } from '../../../lib/ad-sizes';
import { PREBID_TIMEOUT } from '../../../lib/constants/prebid-timeout';
import { EventTimer } from '../../../lib/event-timer';
import type { PageTargeting } from '../../../lib/targeting/build-page-targeting';
import { pubmatic } from '../../__vendor/pubmatic';
import { getAdvertById } from '../../dfp/get-advert-by-id';
import { isUserLoggedInOktaRefactor } from '../../identity/api';
import { getPageTargeting } from '../../page-targeting';
import type {
	BidderCode,
	HeaderBiddingSlot,
	PrebidBid,
	PrebidMediaTypes,
	SlotFlatMap,
} from '../prebid-types';
import { getHeaderBiddingAdSlots } from '../slot-config';
import { stripDfpAdPrefixFrom } from '../utils';
import { bids } from './bid-config';
import type { PrebidPriceGranularity } from './price-config';
import {
	criteoPriceGranularity,
	indexPriceGranularity,
	ozonePriceGranularity,
	priceGranularity,
} from './price-config';

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
	params?: Record<string, string>;
	storage: {
		type: 'cookie';
		name: string;
		expires: number;
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
		site: {
			keywords: string;
			ext: {
				data: {
					keywords: string[];
				};
			};
		};
	};
	consentManagement?: ConsentManagement;
	realTimeData?: unknown;
	criteo?: {
		fastBidVersion: 'latest' | 'none' | `${number}`;
	};
	improvedigital?: {
		usePrebidSizes?: boolean;
	};
};

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

type EnableAnalyticsConfig = {
	provider: string;
	options: {
		ajaxUrl: string;
		pv: string;
	};
};

// bidResponse expected types. Check with advertisers
type XaxisBidResponse = {
	appnexus: {
		buyerMemberId: string;
	};
	[x: string]: unknown;
};

type BuyerTargeting<T> = {
	key: string;
	val: (bidResponse: DeepPartial<T>) => string | null | undefined;
};

/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/bidderSettings.html */
type BidderSetting<T = Record<string, unknown>> = {
	adserverTargeting: Array<BuyerTargeting<T>>;
	bidCpmAdjustment: (n: number) => number;
	suppressEmptyKeys: boolean;
	sendStandardTargeting: boolean;
	storageAllowed: boolean;
};

type BidderSettings = {
	standard?: never; // prevent overriding the default settings
	xhb?: Partial<BidderSetting<XaxisBidResponse>>;
	improvedigital?: Partial<BidderSetting>;
	ozone?: Partial<BidderSetting>;
	criteo?: Partial<BidderSetting>;
	kargo?: Partial<BidderSetting>;
	magnite?: Partial<BidderSetting>;
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

		this.bids = bids(advert.id, slot.sizes, pageTargeting, this.gpid);

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
				config: {
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
			enableAnalytics: (arg0: [EnableAnalyticsConfig]) => void;
			onEvent: (event: PbjsEvent, handler: PbjsEventHandler) => void;
			setTargetingForGPTAsync: (
				codeArr?: string[],
				customSlotMatching?: (slot: unknown) => unknown,
			) => void;
		};
	}
}

const shouldEnableAnalytics = (): boolean => {
	const analyticsSampleRate = 10 / 100;
	const isInSample = Math.random() < analyticsSampleRate;

	const isInServerSideTest =
		Object.keys(window.guardian.config.tests ?? {}).length > 0;
	const isInClientSideTest = Object.keys(getParticipations()).length > 0;
	return isInServerSideTest || isInClientSideTest || isInSample;
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

const initialise = (
	window: Window,
	framework: ConsentFramework = 'tcfv2',
): void => {
	if (!window.pbjs) {
		log('commercial', 'window.pbjs not found on window');
		return; // We couldn’t initialise
	}
	initialised = true;

	const userSync: UserSync = window.guardian.config.switches.prebidUserSync
		? {
				syncsPerBidder: 0, // allow all syncs
				filterSettings: {
					all: {
						bidders: '*', // allow all bidders to sync by iframe or image beacons
						filter: 'include',
					},
				},
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
			}
		: { syncEnabled: false };

	const consentManagement = (): ConsentManagement => {
		switch (framework) {
			case 'aus':
				// https://docs.prebid.org/dev-docs/modules/consentManagementUsp.html
				return {
					usp: {
						cmpApi: 'iab',
						timeout: 1500,
					},
				};
			case 'usnat':
				// https://docs.prebid.org/dev-docs/modules/consentManagementGpp.html
				return {
					gpp: {
						cmpApi: 'iab',
						timeout: 1500,
					},
				};
			case 'tcfv2':
			default:
				// https://docs.prebid.org/dev-docs/modules/consentManagementTcf.html
				return {
					gdpr: {
						cmpApi: 'iab',
						timeout: 200,
						defaultGdprScope: true,
					},
				};
		}
	};

	const pbjsConfig: PbjsConfig = Object.assign(
		{},
		{
			bidderTimeout,
			timeoutBuffer,
			priceGranularity,
			userSync,
		},
	);

	const shouldIncludeKeywords = isUserInVariant(prebidKeywords, 'variant');
	const keywordsString = window.guardian.config.page.keywords;
	const keywordsArray = keywordsString ? keywordsString.split(',') : [];

	if (shouldIncludeKeywords) {
		pbjsConfig.ortb2 = {
			site: {
				keywords: keywordsString,
				ext: {
					data: {
						keywords: keywordsArray,
					},
				},
			},
		};
	}

	window.pbjs.bidderSettings = {};

	if (window.guardian.config.switches.consentManagement) {
		pbjsConfig.consentManagement = consentManagement();
	}

	if (
		window.guardian.config.switches.permutive &&
		window.guardian.config.switches.prebidPermutiveAudience // this switch specifically controls whether or not the Permutive Audience Connector can run with Prebid
	) {
		pbjsConfig.realTimeData = {
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
		};
	}

	if (window.guardian.config.switches.prebidCriteo) {
		window.pbjs.bidderSettings.criteo = {
			storageAllowed: true,
		};

		pbjsConfig.criteo = {
			fastBidVersion: 'latest',
		};

		// Use a custom price granularity for Criteo
		// Criteo has a different line item structure and so bids should be rounded to match these
		window.pbjs.setBidderConfig({
			bidders: ['criteo'],
			config: {
				customPriceBucket: criteoPriceGranularity,
			},
		});
	}

	if (window.guardian.config.switches.prebidOzone) {
		// Use a custom price granularity, which is based upon the size of the slot being auctioned
		window.pbjs.setBidderConfig({
			bidders: ['ozone'],
			config: {
				// Select the ozone granularity, use default if not defined for the size
				guCustomPriceBucket: ({ width, height }) => {
					const ozoneGranularity = ozonePriceGranularity(
						width,
						height,
					);
					log(
						'commercial',
						`Custom Prebid - Ozone price bucket for size (${width},${height}):`,
						ozoneGranularity,
					);
					return ozoneGranularity;
				},
			},
		});
	}

	if (window.guardian.config.switches.prebidIndexExchange) {
		window.pbjs.setBidderConfig({
			bidders: ['ix'],
			config: {
				guCustomPriceBucket: ({ width, height }) => {
					const indexGranularity = indexPriceGranularity(
						width,
						height,
					);
					log(
						'commercial',
						`Custom Prebid - Index price bucket for size (${width},${height}):`,
						indexGranularity,
					);

					return indexGranularity;
				},
			},
		});
	}

	if (
		window.guardian.config.switches.prebidAnalytics &&
		shouldEnableAnalytics()
	) {
		window.pbjs.enableAnalytics([
			{
				provider: 'gu',
				options: {
					ajaxUrl: window.guardian.config.page.isDev
						? `//performance-events.code.dev-guardianapis.com/header-bidding`
						: `//performance-events.guardianapis.com/header-bidding`,
					pv: window.guardian.ophan.pageViewId,
				},
			},
		]);
	}

	if (window.guardian.config.switches.prebidXaxis) {
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

	if (window.guardian.config.switches.prebidImproveDigital) {
		// Add placement ID for Improve Digital, reading from the bid response
		const REGEX_PID = new RegExp(/placement_id=\\?"(\d+)\\?"/);
		window.pbjs.bidderSettings.improvedigital = {
			adserverTargeting: [
				{
					key: 'hb_pid',
					val(bidResponse) {
						if (!isString(bidResponse.ad)) return undefined;

						const matches = REGEX_PID.exec(bidResponse.ad);
						const pid = matches?.[1];
						return pid;
					},
				},
			],
			suppressEmptyKeys: true,
		};

		pbjsConfig.improvedigital = {
			usePrebidSizes: true,
		};
	}

	if (window.guardian.config.switches.prebidKargo) {
		window.pbjs.bidderSettings.kargo = {
			storageAllowed: true,
		};
	}

	if (window.guardian.config.switches.prebidMagnite) {
		window.pbjs.bidderSettings.magnite = {
			storageAllowed: true,
		};
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
			const isSignedIn = await isUserLoggedInOktaRefactor();
			const pageTargeting = getPageTargeting(consentState, isSignedIn);
			return flatten(
				adverts.map((advert) =>
					getHeaderBiddingAdSlots(advert, slotFlatMap)
						.map(
							(slot) =>
								new PrebidAdUnit(advert, slot, pageTargeting),
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
