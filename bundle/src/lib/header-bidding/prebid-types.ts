import type { Size } from 'prebid.js/dist/src/types/common';

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
	sizes: Size[];
};

type HeaderBiddingSizeMapping = Record<
	HeaderBiddingSizeKey,
	Partial<Record<'desktop' | 'tablet' | 'mobile', Size[]>>
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
	size: Size;
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
			/*
			 * @deprecated
			 * @see: https://docs.prebid.org/dev-docs/bidders/criteo.html
			 */
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
	bidParams: (slotId: string, sizes: Size[]) => PrebidParams;
};

type PrebidMediaTypes = {
	banner: {
		sizes: Size[];
	};
};

type SlotFlatMap = (slot: HeaderBiddingSlot) => HeaderBiddingSlot[];

export type {
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
	PrebidMediaTypes,
	SlotFlatMap,
};
