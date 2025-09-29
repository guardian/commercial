import type { AdSize } from '@guardian/commercial-core/ad-sizes';

type HeaderBiddingSize = AdSize;

type HeaderBiddingSlotName =
	| 'banner'
	| 'comments'
	| 'comments-expanded'
	| 'crossword-banner-mobile'
	| 'football-right'
	| 'mobile-sticky'
	| 'mostpop'
	| 'right'
	| 'top-above-nav'
	| 'merchandising'
	| 'merchandising-high'
	| 'article-end'
	| `fronts-banner-${number}`
	| `inline${number}`;

type HeaderBiddingSizeKey = HeaderBiddingSlotName | 'inline' | 'fronts-banner';

type HeaderBiddingSlot = {
	key: HeaderBiddingSizeKey;
	sizes: HeaderBiddingSize[];
};

type HeaderBiddingSizeMapping = Record<
	HeaderBiddingSizeKey,
	Partial<Record<'desktop' | 'tablet' | 'mobile', AdSize[]>>
>;

type PrebidOzoneParams = {
	publisherId: string;
	siteId: string;
	placementId: string;
	customData?: [Record<string, unknown>];
	ozoneData?: Record<string, unknown>;
};

type PrebidPubmaticParams = {
	publisherId: string;
	adSlot: string;
	placementId?: string;
};

type PrebidIndexExchangeParams = {
	siteId: string;
	size: HeaderBiddingSize;
};

type PrebidTrustXParams = {
	uid: string;
};

type PrebidTripleLiftParams = {
	inventoryCode: string;
	tagid: string;
};

type PrebidXaxisParams = {
	placementId: number;
};

type PrebidAppNexusParams = {
	invCode?: string;
	member?: string;
	placementId?: string;
	keywords: unknown;
	lotame?: unknown;
};

type PrebidOpenXParams = {
	delDomain: string;
	unit: string;
	customParams: unknown;
	lotame?: unknown;
};

type PrebidCriteoParams =
	| {
			zoneId: number;
	  }
	| {
			networkId: number;
			pubId?: number;
	  };

type PrebidKargoParams = {
	placementId: string;
};

//This is used to be called Rubicon but now it's called Magnite. You can find it in the Prebid.js codebase as Rubicon
type PrebidMagniteParams = {
	accountId: number;
	siteId: number;
	zoneId: number;
	keywords: string[];
};

type PrebidTheTradeDeskParams = {
	supplySourceId: string;
	publisherId: string;
	placementId: string;
};

type BidderCode =
	| 'and'
	| 'criteo'
	| 'ix'
	| 'kargo'
	| 'rubicon'
	| 'oxd'
	| 'ozone'
	| 'pubmatic'
	| 'triplelift'
	| 'trustx'
	| 'xhb'
	| 'ttd';

type PrebidParams =
	| PrebidAppNexusParams
	| PrebidCriteoParams
	| PrebidIndexExchangeParams
	| PrebidKargoParams
	| PrebidMagniteParams
	| PrebidOpenXParams
	| PrebidOzoneParams
	| PrebidPubmaticParams
	| PrebidTripleLiftParams
	| PrebidTrustXParams
	| PrebidXaxisParams
	| PrebidTheTradeDeskParams;

type PrebidBidder = {
	name: BidderCode;
	switchName: string;
	bidParams: (slotId: string, sizes: HeaderBiddingSize[]) => PrebidParams;
};

type PrebidBid = {
	bidder: string;
	params: PrebidParams;
};

type PrebidBidderRequest = {
	bidderCode: string;
};

type PrebidBidReqestedEvent = {
	eventType: 'bidRequested';
	args: {
		bids: PrebidBid[];
	};
};

type PrebidBidderErrorEvent = {
	eventType: 'bidderError';
	args: {
		bidderRequest: PrebidBidderRequest;
		error: {
			timedOut?: boolean;
		};
	};
};

type PrebidAuctionInitEvent = {
	eventType: 'auctionInit';
	args: {
		adUnitCodes: string[];
		bidderRequests: PrebidBidderRequest[];
	};
};

type PrebidAuctionEndEvent = {
	eventType: 'auctionEnd';
	args: {
		adUnitCodes: string[];
		bidsReceived: PrebidBid[];
	};
};

type PrebidEvent =
	| PrebidBidReqestedEvent
	| PrebidBidderErrorEvent
	| PrebidAuctionInitEvent
	| PrebidAuctionEndEvent;

type PrebidMediaTypes = {
	banner: {
		sizes: HeaderBiddingSize[];
	};
};

type SlotFlatMap = (slot: HeaderBiddingSlot) => HeaderBiddingSlot[];

interface AnalyticsAdapterConfig {
	analyticsType: string;
}

interface BidArgs {
	bidderCode?: string;
	adserverTargeting?: Record<string, string>;
	adId?: string;
	requestId?: string;
	auctionId?: string;
	bidder?: string;
	bidId?: string;
	bids?: Array<{
		adUnitCode?: string;
		bidId?: string;
	}>;
	adUnitCode?: string;
	cpm?: number;
	pbCg?: number;
	currency?: string;
	netRevenue?: boolean;
	creativeId?: string;
	size?: string;
	timeToRespond?: number;
	dealId?: string;
	statusMessage?: string;
	start?: number;
	meta?: {
		networkId?: string;
		buyerId?: string;
		brandId?: string;
		brandName?: string;
		clickUrl?: string;
	};
}

type TrackParams = {
	eventType: string;
	args: BidArgs;
};

const eventKeys = [
	'ev',
	'aid',
	'bid',
	'st',
	'n',
	'sid',
	'cpm',
	'pb',
	'cry',
	'net',
	'did',
	'cid',
	'sz',
	'ttr',
	'lid',
	'dsp',
	'adv',
	'bri',
	'brn',
	'add',
] as const;

type EventData = Partial<
	Record<(typeof eventKeys)[number], string | number | boolean>
>;

type RawEventData = Partial<
	Record<
		(typeof eventKeys)[number],
		string | number | boolean | undefined | null
	>
>;

interface AnalyticsAdapterContext {
	url: string;
	pv: string;
	auctionTimeStart?: number;
}

interface AnalyticsOptions {
	url: string;
	pv: string;
}

interface AnalyticsAdapter {
	track: (params: TrackParams) => void;
	enableAnalytics: (config: { options: AnalyticsOptions }) => void;
	originEnableAnalytics?: (config: { options: AnalyticsOptions }) => void;
	context?: AnalyticsAdapterContext;
	ajaxCall: (data: string) => void;
}

interface AnalyticsConfig {
	provider: 'gu';
	options: AnalyticsOptions;
}

type Handler = (adapter: AnalyticsAdapter, args: BidArgs) => EventData[] | null;

export { eventKeys };

export type {
	HeaderBiddingSize,
	HeaderBiddingSlotName,
	HeaderBiddingSizeKey,
	HeaderBiddingSlot,
	HeaderBiddingSizeMapping,
	PrebidOzoneParams,
	PrebidPubmaticParams,
	PrebidIndexExchangeParams,
	PrebidTrustXParams,
	PrebidTripleLiftParams,
	PrebidXaxisParams,
	PrebidAppNexusParams,
	PrebidOpenXParams,
	PrebidCriteoParams,
	PrebidKargoParams,
	PrebidMagniteParams,
	PrebidTheTradeDeskParams,
	BidderCode,
	PrebidParams,
	PrebidBidder,
	PrebidBid,
	PrebidBidderRequest,
	PrebidBidReqestedEvent,
	PrebidBidderErrorEvent,
	PrebidAuctionInitEvent,
	PrebidAuctionEndEvent,
	PrebidEvent,
	PrebidMediaTypes,
	SlotFlatMap,
	BidArgs,
	EventData,
	RawEventData,
	AnalyticsOptions,
	AnalyticsConfig,
	AnalyticsAdapter,
	AnalyticsAdapterConfig,
	Handler,
};
