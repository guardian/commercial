import { log } from '@guardian/libs';
import {
	isInAuOrNz,
	isInRow,
	isInUk,
	isInUsa,
	isInUsOrCa,
} from '../../../lib/geo/geo-utils';
import type { PageTargeting } from '../../../lib/targeting/build-page-targeting';
import { pbTestNameMap } from '../../../lib/url';
import type { PrebidIndexSite } from '../../../types/global';
import { dfpEnv } from '../../dfp/dfp-env';
import { buildAppNexusTargetingObject } from '../../page-targeting';
import type {
	BidderCode,
	HeaderBiddingSize,
	PrebidAdYouLikeParams,
	PrebidAppNexusParams,
	PrebidBid,
	PrebidBidder,
	PrebidImproveParams,
	PrebidIndexExchangeParams,
	PrebidKargoParams,
	PrebidMagniteParams,
	PrebidOpenXParams,
	PrebidOzoneParams,
	PrebidPubmaticParams,
	PrebidTripleLiftParams,
	PrebidTrustXParams,
	PrebidXaxisParams,
} from '../prebid-types';
import {
	containsBillboard,
	containsBillboardNotLeaderboard,
	containsDmpu,
	containsLeaderboard,
	containsLeaderboardOrBillboard,
	containsMobileSticky,
	containsMpu,
	containsMpuOrDmpu,
	containsPortraitInterstitial,
	containsWS,
	getBreakpointKey,
	shouldIncludeAppNexus,
	shouldIncludeImproveDigital,
	shouldIncludeImproveDigitalSkin,
	shouldIncludeKargo,
	shouldIncludeMagnite,
	shouldIncludeOpenx,
	shouldIncludeTripleLift,
	shouldIncludeTrustX,
	shouldIncludeXaxis,
	shouldUseOzoneAdaptor,
	stripDfpAdPrefixFrom,
	stripMobileSuffix,
} from '../utils';
import { getAppNexusDirectBidParams } from './appnexus';
import {
	getImprovePlacementId,
	getImproveSizeParam,
	getImproveSkinPlacementId,
} from './improve-digital';
import { getMagniteSiteId, getMagniteZoneId } from './magnite';

const isArticle = window.guardian.config.page.contentType === 'Article';
const isDesktopAndArticle = getBreakpointKey() === 'D' && isArticle;

const getTrustXAdUnitId = (
	slotId: string,
	isDesktopArticle: boolean,
): string => {
	switch (stripMobileSuffix(slotId)) {
		case 'dfp-ad--inline1':
			return '2960';
		case 'dfp-ad--inline2':
			if (isDesktopArticle) return '3826';
			return '3827';
		case 'dfp-ad--inline3':
			if (isDesktopArticle) return '3828';
			return '3829';
		case 'dfp-ad--inline4':
			if (isDesktopArticle) return '3830';
			return '3831';
		case 'dfp-ad--inline5':
			if (isDesktopArticle) return '3832';
			return '3833';
		case 'dfp-ad--inline6':
			if (isDesktopArticle) return '3834';
			return '3835';
		case 'dfp-ad--inline7':
			if (isDesktopArticle) return '3836';
			return '3837';
		case 'dfp-ad--inline8':
			if (isDesktopArticle) return '3838';
			return '3839';
		case 'dfp-ad--inline9':
			if (isDesktopArticle) return '3840';
			return '3841';
		case 'dfp-ad--mostpop':
			return '2961';
		case 'dfp-ad--right':
			return '2962';
		case 'dfp-ad--top-above-nav':
			return '2963';
		case 'dfp-ad--comments':
			return '3840';
		case 'dfp-ad--mobile-sticky':
			return '8519';
		default:
			// for inline10 and onwards just use same IDs as inline9
			if (slotId.startsWith('dfp-ad--inline')) {
				if (isDesktopArticle) return '3840';
				return '3841';
			}
			log(
				'commercial',
				`PREBID: Failed to get TrustX ad unit for slot ${slotId}.`,
			);
			return '';
	}
};

/**
 * We store a mapping of sections to Index site ids server-side, where each is
 * split out by breakpoint. These are transferred to the client via the window,
 * and read here
 *
 * This appears to be an old method of assigning site ids, with the newer method
 * being to assign them according to ad size (@see getIndexSiteId)
 */
const getIndexSiteIdFromConfig = (): string => {
	const site = window.guardian.config.page.pbIndexSites.find(
		(s: PrebidIndexSite) => s.bp === getBreakpointKey(),
	);
	return site?.id ? site.id.toString() : '';
};

const getIndexSiteId = (slotSizes: HeaderBiddingSize[]) => {
	// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
	// This check is to distinguish from the top-above-nav slot, which includes a leaderboard
	if (containsBillboardNotLeaderboard(slotSizes)) {
		return '983842';
	}

	// Return a specific site id for the mobile sticky slot
	if (containsMobileSticky(slotSizes)) {
		return '1047869';
	}

	// Fall back to reading the site id from the window
	return getIndexSiteIdFromConfig();
};

const getXaxisPlacementId = (sizes: HeaderBiddingSize[]): number => {
	switch (getBreakpointKey()) {
		case 'D':
			if (containsMpuOrDmpu(sizes)) {
				return 20943665;
			}
			if (containsLeaderboardOrBillboard(sizes)) {
				return 20943666;
			}
			return 20943668;
		case 'M':
			if (containsMpuOrDmpu(sizes)) {
				return 20943669;
			}
			return 20943670;
		case 'T':
			if (containsMpuOrDmpu(sizes)) {
				return 20943671;
			}
			if (containsLeaderboardOrBillboard(sizes)) {
				return 20943672;
			}
			return 20943674;
		default:
			return -1;
	}
};

const getTripleLiftInventoryCode = (
	slotId: string,
	sizes: HeaderBiddingSize[],
): string => {
	if (containsLeaderboard(sizes)) {
		if (isInUsOrCa()) {
			return 'theguardian_topbanner_728x90_prebid';
		} else if (isInAuOrNz()) {
			return 'theguardian_topbanner_728x90_prebid_AU';
		}
	}

	if (containsMpu(sizes)) {
		if (isInUsOrCa()) {
			return isArticle
				? 'theguardian_article_300x250_prebid'
				: 'theguardian_sectionfront_300x250_prebid';
		} else if (isInAuOrNz()) {
			return isArticle
				? 'theguardian_article_300x250_prebid_AU'
				: 'theguardian_sectionfront_300x250_prebid_AU';
		}
	}

	if (containsMobileSticky(sizes)) {
		if (isInUsOrCa()) {
			return 'theguardian_320x50_HDX';
		} else if (isInAuOrNz()) {
			return 'theguardian_320x50_HDX_AU';
		}
	}

	return '';
};

// Is pbtest being used?
const isPbTestOn = () => Object.keys(pbTestNameMap()).length > 0;
// Helper for conditions
const inPbTestOr = (liveClause: boolean) => isPbTestOn() || liveClause;

/* Bidders */
const appNexusBidder: (pageTargeting: PageTargeting) => PrebidBidder = (
	pageTargeting: PageTargeting,
) => ({
	name: 'and',
	switchName: 'prebidAppnexus',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidAppNexusParams =>
		getAppNexusDirectBidParams(
			sizes,
			pageTargeting,
			stripDfpAdPrefixFrom(slotId),
		),
});

const openxClientSideBidder: (pageTargeting: PageTargeting) => PrebidBidder = (
	pageTargeting: PageTargeting,
) => ({
	name: 'oxd',
	switchName: 'prebidOpenx',
	bidParams: (slotId, sizes): PrebidOpenXParams => {
		const customParams = buildAppNexusTargetingObject(pageTargeting);
		if (isInUsOrCa()) {
			return {
				delDomain: 'guardian-us-d.openx.net',
				unit: '540279544',
				customParams,
			};
		}
		if (isInAuOrNz()) {
			return {
				delDomain: 'guardian-aus-d.openx.net',
				unit: '540279542',
				customParams,
			};
		}
		// ROW has a unique unit ID for mobile-sticky
		if (isInRow() && containsMobileSticky(sizes)) {
			return {
				delDomain: 'guardian-d.openx.net',
				unit: '560429384',
				customParams,
			};
		}
		// UK and ROW
		return {
			delDomain: 'guardian-d.openx.net',
			unit: '540279541',
			customParams,
		};
	},
});

const getOzonePlacementId = (sizes: HeaderBiddingSize[]) => {
	if (isInUsa()) {
		if (getBreakpointKey() === 'D') {
			if (containsBillboard(sizes)) {
				return '3500010912';
			}

			if (containsMpu(sizes)) {
				return '3500010911';
			}
		}
		if (getBreakpointKey() === 'M') {
			if (containsMobileSticky(sizes)) {
				return '3500014217';
			}
		}
		return '1420436308';
	}

	if (isInRow()) {
		if (containsMobileSticky(sizes)) {
			return '1500000260';
		}
	}
	return '0420420500';
};

const ozoneClientSideBidder: (pageTargeting: PageTargeting) => PrebidBidder = (
	pageTargeting: PageTargeting,
) => ({
	name: 'ozone',
	switchName: 'prebidOzone',
	bidParams: (
		_slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidOzoneParams => {
		const advert = dfpEnv.adverts.get(_slotId);
		const testgroup = advert?.testgroup
			? { testgroup: advert.testgroup }
			: {};

		return {
			publisherId: 'OZONEGMG0001',
			siteId: '4204204209',
			placementId: getOzonePlacementId(sizes),
			customData: [
				{
					settings: {},
					targeting: {
						// Assigns a random integer between 0 and 99
						...testgroup,
						...buildAppNexusTargetingObject(pageTargeting),
					},
				},
			],
			ozoneData: {}, // TODO: confirm if we need to send any
		};
	},
});

const getPubmaticPublisherId = (): string => {
	if (isInUsOrCa()) {
		return '157206';
	}

	if (isInAuOrNz()) {
		return '157203';
	}

	return '157207';
};

const getKargoPlacementId = (sizes: HeaderBiddingSize[]): string => {
	if (getBreakpointKey() === 'D') {
		// top-above-nav on desktop, fronts-banners in the future
		if (containsLeaderboardOrBillboard(sizes)) {
			return '_yflg9S7c2x';
		}
		// right hand slots on desktop, aka right, inline2+ or mostpop
		if (containsMpu(sizes) && containsDmpu(sizes)) {
			return '_zOpeEAyfiz';
		}
		// other MPUs on desktop (inline1)
		return '_qDBbBXYtzA';
	}
	// mobile-sticky on mobile
	if (containsMobileSticky(sizes)) {
		return '_odszPLn2hK';
	}

	// MPUs on mobile aka top-above-nav, inline on mobile and tablet
	return '_y9LINEsbfh';
};

const getAdYouLikePlacementId = (sizes: HeaderBiddingSize[]) => {
	if (isInUk()) {
		if (getBreakpointKey() === 'D') {
			// right column ads
			if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
				return 'f13e6a47512bf890773b71ce4db22716';
			}
			// fronts banner ads
			if (containsBillboardNotLeaderboard(sizes)) {
				return '6c4808fb7433e73fb4286ce9de37e008';
			}
			// top-above-nav ads
			if (containsLeaderboardOrBillboard(sizes)) {
				return '36f00dee2120882f586386b4099e765d';
			}
		} else {
			if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
				return '46ce2d1ab64e2f57e676276741134129';
			}

			if (containsMobileSticky(sizes)) {
				return 'eb72424b9cc2e064a3ea7a422c9ae8e6';
			}
		}
	}

	if (isInUsa()) {
		if (getBreakpointKey() === 'D') {
			// right column ads
			if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
				return 'fa1a02c6e1d5b2927ada54668c564ac5';
			}
			// fronts banner ads
			if (containsBillboardNotLeaderboard(sizes)) {
				return '7b3e5955c24514cacd19586a0c3ca8d1';
			}
			// top-above-nav ads
			if (containsLeaderboardOrBillboard(sizes)) {
				return '6538fe3160263c1db103fa48935fa1ca';
			}
		} else {
			if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
				return 'c0a40010a5fb523c0c1f28063cf095bc';
			}

			if (containsMobileSticky(sizes)) {
				return 'c1a7d9313dc64e5e174da07b29d62ace';
			}
		}
	}

	if (isInAuOrNz()) {
		if (getBreakpointKey() === 'D') {
			// right column ads
			if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
				return '1a026103c696e2924fff74c362f4c44e';
			}
			// fronts banner ads
			if (containsBillboardNotLeaderboard(sizes)) {
				return 'd2ba4b6f6371c81976d7b0356e088dc8';
			}
			// top-above-nav ads
			if (containsLeaderboardOrBillboard(sizes)) {
				return 'bb68a1ef4d72921b540620a4e97264b8';
			}
		} else {
			if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
				return '7a95bbb40a6d37dedf68c9be7b15e2ca';
			}

			if (containsMobileSticky(sizes)) {
				return 'd2f94e1671435be5adab1b7e222803f2';
			}
		}
	}

	if (isInRow()) {
		if (getBreakpointKey() === 'D') {
			// right column ads
			if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
				return '98bfc2a063396e3fdd1d5b729d77b5ae';
			}
			// fronts banner ads
			if (containsBillboardNotLeaderboard(sizes)) {
				return 'c985777ffdbe07f0a91ccfc701e3e00c';
			}
			// top-above-nav ads
			if (containsLeaderboardOrBillboard(sizes)) {
				return 'b76bab7ff7c81b36b0524415d94d3f61';
			}
		} else {
			if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
				return 'e9e27e87d2f4d9440500f86a1ee87ed0';
			}

			if (containsMobileSticky(sizes)) {
				return '479e1cc587ea707e7ed2421f60d0e1b1';
			}
		}
	}

	return '';
};

const getPubmaticPlacementId = (
	slotId: string,
	slotSizes: HeaderBiddingSize[],
): string | undefined => {
	if (
		slotId === 'dfp-ad--inline2' &&
		slotSizes.find((size) => size.width === 371 && size.height === 660)
	) {
		return isInUsa()
			? 'seenthis_guardian_mweb_us'
			: 'seenthis_guardian_371x660_mweb';
	}
	return undefined;
};

const pubmaticBidder = (slotSizes: HeaderBiddingSize[]): PrebidBidder => {
	const defaultParams = {
		name: 'pubmatic' as BidderCode,
		switchName: 'prebidPubmatic',
		bidParams: (slotId: string): PrebidPubmaticParams => ({
			publisherId: getPubmaticPublisherId(),
			adSlot: stripDfpAdPrefixFrom(slotId),
			placementId: getPubmaticPlacementId(slotId, slotSizes),
		}),
	};

	// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
	// This check is to distinguish from the top-above-nav which, includes a leaderboard
	if (containsBillboardNotLeaderboard(slotSizes)) {
		return {
			...defaultParams,
			bidParams: (slotId: string): PrebidPubmaticParams => ({
				...defaultParams.bidParams(slotId),
				placementId: 'theguardian_970x250_only',
			}),
		};
	}

	return defaultParams;
};

const trustXBidder: PrebidBidder = {
	name: 'trustx',
	switchName: 'prebidTrustx',
	bidParams: (slotId: string): PrebidTrustXParams => ({
		uid: getTrustXAdUnitId(slotId, isDesktopAndArticle),
	}),
};

const tripleLiftBidder: PrebidBidder = {
	name: 'triplelift',
	switchName: 'prebidTriplelift',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidTripleLiftParams => ({
		inventoryCode: getTripleLiftInventoryCode(slotId, sizes),
	}),
};

const improveDigitalBidder: PrebidBidder = {
	name: 'improvedigital',
	switchName: 'prebidImproveDigital',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidImproveParams => ({
		publisherId: 995,
		placementId: getImprovePlacementId(sizes),
		size: getImproveSizeParam(slotId, isDesktopAndArticle),
	}),
};

const improveDigitalSkinBidder: PrebidBidder = {
	name: 'improvedigital',
	switchName: 'prebidImproveDigitalSkins',
	bidParams: (): PrebidImproveParams => ({
		placementId: getImproveSkinPlacementId(),
		size: {},
	}),
};

const xaxisBidder: PrebidBidder = {
	name: 'xhb',
	switchName: 'prebidXaxis',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidXaxisParams => ({
		placementId: getXaxisPlacementId(sizes),
	}),
};

const adYouLikeBidder: PrebidBidder = {
	name: 'adyoulike',
	switchName: 'prebidAdYouLike',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidAdYouLikeParams => ({
		placement: getAdYouLikePlacementId(sizes),
	}),
};

const criteoBidder = (slotSizes: HeaderBiddingSize[]): PrebidBidder => {
	const defaultParams = {
		name: 'criteo' as BidderCode,
		switchName: 'prebidCriteo',
	};

	// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
	// This check is to distinguish from the top-above-nav slot, which includes a leaderboard
	if (containsBillboardNotLeaderboard(slotSizes)) {
		return {
			...defaultParams,
			bidParams: () => ({
				zoneId: 1759354,
			}),
		};
	}

	return {
		...defaultParams,
		bidParams: () => ({
			networkId: 337,
		}),
	};
};

const kargoBidder: PrebidBidder = {
	name: 'kargo',
	switchName: 'prebidKargo',
	bidParams: (
		_slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidKargoParams => ({
		placementId: getKargoPlacementId(sizes),
	}),
};

const magniteBidder: PrebidBidder = {
	//Rubicon is the old name for Magnite but it is still used for the integration
	name: 'rubicon',
	switchName: 'prebidMagnite',
	bidParams: (
		slotId: string,
		sizes: HeaderBiddingSize[],
	): PrebidMagniteParams => ({
		accountId: 26644,
		siteId: getMagniteSiteId(),
		zoneId: getMagniteZoneId(slotId, sizes),
		keywords: window.guardian.config.page.keywords
			? window.guardian.config.page.keywords.split(',')
			: [],
	}),
};

const theTradeDeskBidder = (gpid: string): PrebidBidder => ({
	name: 'ttd',
	switchName: 'prebidTheTradeDesk',
	bidParams: () => ({
		supplySourceId: 'theguardian',
		publisherId: '1',
		placementId: gpid,
	}),
});

// There's an IX bidder for every size that the slot can take
const indexExchangeBidders = (
	slotSizes: HeaderBiddingSize[],
): PrebidBidder[] => {
	const siteId = getIndexSiteId(slotSizes);
	return slotSizes.map((size) => ({
		name: 'ix',
		switchName: 'prebidIndexExchange',
		bidParams: (): PrebidIndexExchangeParams => ({
			siteId,
			size,
		}),
	}));
};

const biddersBeingTested = (allBidders: PrebidBidder[]): PrebidBidder[] =>
	allBidders.filter((bidder) => pbTestNameMap()[bidder.name]);

const biddersSwitchedOn = (allBidders: PrebidBidder[]): PrebidBidder[] => {
	const isSwitchedOn = (bidder: PrebidBidder): boolean =>
		window.guardian.config.switches[bidder.switchName] ?? false;

	return allBidders.filter((bidder) => isSwitchedOn(bidder));
};

const currentBidders = (
	slotSizes: HeaderBiddingSize[],
	pageTargeting: PageTargeting,
	gpid: string,
): PrebidBidder[] => {
	const biddersToCheck: Array<[boolean, PrebidBidder]> = [
		[true, criteoBidder(slotSizes)],
		[shouldIncludeTrustX(), trustXBidder],
		[shouldIncludeTripleLift(), tripleLiftBidder],
		[shouldIncludeAppNexus(), appNexusBidder(pageTargeting)],
		[shouldIncludeImproveDigital(), improveDigitalBidder],
		[shouldIncludeImproveDigitalSkin(), improveDigitalSkinBidder],
		[shouldIncludeXaxis(), xaxisBidder],
		[true, pubmaticBidder(slotSizes)],
		[true, adYouLikeBidder],
		[shouldUseOzoneAdaptor(), ozoneClientSideBidder(pageTargeting)],
		[shouldIncludeOpenx(), openxClientSideBidder(pageTargeting)],
		[shouldIncludeKargo(), kargoBidder],
		[shouldIncludeMagnite(), magniteBidder],
		[true, theTradeDeskBidder(gpid)],
	];

	const otherBidders = biddersToCheck
		.filter(([shouldInclude]) => inPbTestOr(shouldInclude))
		.map(([, bidder]) => bidder);

	const allBidders = indexExchangeBidders(slotSizes).concat(otherBidders);
	return isPbTestOn()
		? biddersBeingTested(allBidders)
		: biddersSwitchedOn(allBidders);
};

export const bids = (
	slotId: string,
	slotSizes: HeaderBiddingSize[],
	pageTargeting: PageTargeting,
	gpid: string,
): PrebidBid[] =>
	currentBidders(slotSizes, pageTargeting, gpid).map(
		(bidder: PrebidBidder) => ({
			bidder: bidder.name,
			params: bidder.bidParams(slotId, slotSizes),
		}),
	);

export const _ = {
	getIndexSiteIdFromConfig,
	getXaxisPlacementId,
	getTrustXAdUnitId,
	indexExchangeBidders,
	getOzonePlacementId,
};
