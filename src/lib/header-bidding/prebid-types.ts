import type { AdSize } from 'core/ad-sizes';

export type HeaderBiddingSize = AdSize;

export type HeaderBiddingSlotName =
	| 'banner'
	| 'comments'
	| 'crossword-banner'
	| 'crossword-banner-mobile'
	| 'mobile-sticky'
	| 'mostpop'
	| 'right'
	| 'top-above-nav'
	| 'merchandising'
	| 'merchandising-high'
	| 'article-end'
	| `fronts-banner-${number}`
	| `inline${number}`;

export type HeaderBiddingSizeKey =
	| HeaderBiddingSlotName
	| 'inline'
	| 'fronts-banner'
	| 'comments-expanded';

export type HeaderBiddingSlot = {
	key: HeaderBiddingSizeKey;
	sizes: HeaderBiddingSize[];
};

export type HeaderBiddingSizeMapping = Record<
	HeaderBiddingSizeKey,
	Partial<Record<'desktop' | 'tablet' | 'mobile', AdSize[]>>
>;

export type PrebidOzoneParams = {
	publisherId: string;
	siteId: string;
	placementId: string;
	customData?: [Record<string, unknown>];
	ozoneData?: Record<string, unknown>;
};

export type PrebidSonobiParams = {
	ad_unit: string;
	dom_id: string;
	appNexusTargeting: string;
	pageViewId: string;
	render?: string;
};

export type PrebidPubmaticParams = {
	publisherId: string;
	adSlot: string;
	placementId?: string;
};

export type PrebidIndexExchangeParams = {
	siteId: string;
	size: HeaderBiddingSize;
};

export type PrebidTrustXParams = {
	uid: string;
};

export type PrebidTripleLiftParams = {
	inventoryCode: string;
};

export type PrebidImproveParams = {
	publisherId?: number;
	placementId: number;
	size: {
		w?: number;
		h?: number;
	};
};

export type PrebidXaxisParams = {
	placementId: number;
};

export type PrebidAppNexusParams = {
	invCode?: string;
	member?: string;
	placementId?: string;
	keywords: unknown;
	lotame?: unknown;
};

export type PrebidOpenXParams = {
	delDomain: string;
	unit: string;
	customParams: unknown;
	lotame?: unknown;
};

export type PrebidAdYouLikeParams = {
	placement: string;
};

export type PrebidCriteoParams =
	| {
			networkId: number;
	  }
	| {
			zoneId: number;
	  };

export type PrebidSmartParams = {
	siteId: number;
	pageId: number;
	formatId: number;
};

export type PrebidKargoParams = {
	placementId: string;
};

export type BidderCode =
	| 'adyoulike'
	| 'and'
	| 'appnexus'
	| 'criteo'
	| 'improvedigital'
	| 'ix'
	| 'kargo'
	| 'oxd'
	| 'ozone'
	| 'pubmatic'
	| 'smartadserver'
	| 'sonobi'
	| 'triplelift'
	| 'trustx'
	| 'xhb';

export type PrebidParams =
	| PrebidAdYouLikeParams
	| PrebidAppNexusParams
	| PrebidCriteoParams
	| PrebidImproveParams
	| PrebidIndexExchangeParams
	| PrebidKargoParams
	| PrebidOpenXParams
	| PrebidOzoneParams
	| PrebidPubmaticParams
	| PrebidSmartParams
	| PrebidSonobiParams
	| PrebidTripleLiftParams
	| PrebidTrustXParams
	| PrebidXaxisParams;

export type PrebidBidder = {
	name: BidderCode;
	switchName: string;
	bidParams: (slotId: string, sizes: HeaderBiddingSize[]) => PrebidParams;
};

export type PrebidBid = {
	bidder: string;
	params: PrebidParams;
};

export type PrebidMediaTypes = {
	banner: {
		sizes: HeaderBiddingSize[];
	};
};

export type SlotFlatMap = (slot: HeaderBiddingSlot) => HeaderBiddingSlot[];
