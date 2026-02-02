import type { PrebidPriceGranularity } from 'prebid.js/src/cpmBucketManager';

type CmpApi = 'iab' | 'static';

/** @see https://docs.prebid.org/dev-docs/modules/consentManagementTcf.html */
type GDPRConfig = {
	allowAuctionWithoutConsent?: never;
	cmpApi: CmpApi;
	consentData?: Record<string, unknown>;
	defaultGdprScope: boolean;
	timeout: number;
};

/** @see https://docs.prebid.org/dev-docs/modules/consentManagementUsp.html */
type USPConfig = {
	cmpApi: CmpApi;
	timeout: number;
	consentData?: Record<string, unknown>;
};

/** @see https://docs.prebid.org/dev-docs/modules/consentManagementGpp.html */
type GPPConfig = {
	cmpApi: CmpApi;
	timeout: number;
	actionTimeout?: number;
	consentData?: Record<string, unknown>;
};

export type ConsentManagement =
	| {
			gdpr: GDPRConfig;
	  }
	| {
			usp: USPConfig;
	  }
	| {
			gpp: GPPConfig;
	  };

export type UserId = {
	name: string;
	params?: Record<string, string | number | boolean>;
	storage?: {
		type: 'cookie' | 'html5';
		name: string;
		expires: number;
		refreshInSeconds?: number;
	};
};

export type UserSync =
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

export type PbjsConfig = {
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

export type PbjsBidderConfig = Pick<
	PbjsConfig,
	'customPriceBucket' | 'guCustomPriceBucket' | 'ortb2'
>;

export type PbjsEvent = 'bidWon';

/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/getBidResponses.html */
export type PbjsEventData = {
	adId?: string;
	adserverTargeting?: Record<string, unknown>;
	adUnitCode: string;
	adUrl?: string;
	bidder?: string;
	bidderCode?: BidderCode;
	cpm?: number;
	creative_id?: number;
	height: number;
	requestTimestamp?: number;
	responseTimestamp?: number;
	size?: string;
	statusMessage?: string;
	timeToRespond?: number;
	usesGenericKeys?: boolean;
	width: number;
	[x: string]: unknown;
};
export type PbjsEventHandler = (data: PbjsEventData) => void;

export type BidResponse = {
	adId: string;
	bidder: BidderCode;
	bidderCode: string;
	cpm: number;
	height: number;
	mediaType: string;
	pbCg: string;
	size: string;
	source: string;
	width: number;
	[x: string]: unknown;
};

// bidResponse expected types. Check with advertisers
export type XaxisBidResponse = {
	appnexus?: {
		buyerMemberId?: string;
	};
	[x: string]: unknown;
};

export type BuyerTargeting<T> = {
	key: string;
	val: (bidResponse: T) => string | null | undefined;
};

/** @see https://docs.prebid.org/dev-docs/publisher-api-reference/bidderSettings.html */
export type BidderSetting<T = BidResponse> = {
	adserverTargeting: Array<BuyerTargeting<T>>;
	bidCpmAdjustment: (n: number) => number;
	suppressEmptyKeys: boolean;
	sendStandardTargeting: boolean;
	storageAllowed: boolean;
};

export type BidderSettings = Partial<
	// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- magnite uses a different response type
	Record<Exclude<BidderCode, 'xhb'> | 'magnite', Partial<BidderSetting>>
> & {
	standard?: never; // prevent overriding the default settings
	xhb?: Partial<BidderSetting<XaxisBidResponse>>;
};
