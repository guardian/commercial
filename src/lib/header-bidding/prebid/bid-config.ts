import { log } from '@guardian/libs';
import type { PageTargeting } from 'core/targeting/build-page-targeting';
import {
	buildAppNexusTargeting,
	buildAppNexusTargetingObject,
} from 'lib/build-page-targeting';
import { dfpEnv } from 'lib/dfp/dfp-env';
import { isInAuOrNz, isInUk, isInUsa, isInUsOrCa } from 'lib/utils/geo-utils';
import { pbTestNameMap } from 'lib/utils/url';
import type { PrebidIndexSite } from 'types/global';
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
	PrebidOpenXParams,
	PrebidOzoneParams,
	PrebidPubmaticParams,
	PrebidSonobiParams,
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
	getBreakpointKey,
	shouldIncludeAdYouLike,
	shouldIncludeAppNexus,
	shouldIncludeCriteo,
	shouldIncludeImproveDigital,
	shouldIncludeImproveDigitalSkin,
	shouldIncludeKargo,
	shouldIncludeOpenx,
	shouldIncludeSmart,
	shouldIncludeSonobi,
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

const getIndexSiteId = (): string => {
	const site = window.guardian.config.page.pbIndexSites.find(
		(s: PrebidIndexSite) => s.bp === getBreakpointKey(),
	);
	return site?.id ? site.id.toString() : '';
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
	): PrebidAppNexusParams => getAppNexusDirectBidParams(sizes, pageTargeting),
});

const openxClientSideBidder: (pageTargeting: PageTargeting) => PrebidBidder = (
	pageTargeting: PageTargeting,
) => ({
	name: 'oxd',
	switchName: 'prebidOpenx',
	bidParams: (): PrebidOpenXParams => {
		if (isInUsOrCa()) {
			return {
				delDomain: 'guardian-us-d.openx.net',
				unit: '540279544',
				customParams: buildAppNexusTargetingObject(pageTargeting),
			};
		}
		if (isInAuOrNz()) {
			return {
				delDomain: 'guardian-aus-d.openx.net',
				unit: '540279542',
				customParams: buildAppNexusTargetingObject(pageTargeting),
			};
		}
		// UK and ROW
		return {
			delDomain: 'guardian-d.openx.net',
			unit: '540279541',
			customParams: buildAppNexusTargetingObject(pageTargeting),
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
		return '1420436308';
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

const sonobiBidder: (pageTargeting: PageTargeting) => PrebidBidder = (
	pageTargeting: PageTargeting,
) => ({
	name: 'sonobi',
	switchName: 'prebidSonobi',
	bidParams: (slotId: string): PrebidSonobiParams => ({
		ad_unit: window.guardian.config.page.adUnit,
		dom_id: slotId,
		appNexusTargeting: buildAppNexusTargeting(pageTargeting),
		pageViewId: window.guardian.ophan.pageViewId,
	}),
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

const pubmaticBidder = (slotSizes: HeaderBiddingSize[]): PrebidBidder => {
	const defaultParams = {
		name: 'pubmatic' as BidderCode,
		switchName: 'prebidPubmatic',
		bidParams: (slotId: string): PrebidPubmaticParams => ({
			publisherId: getPubmaticPublisherId(),
			adSlot: stripDfpAdPrefixFrom(slotId),
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
	bidParams: (): PrebidAdYouLikeParams => {
		if (isInUk()) {
			return {
				placement: '2b4d757e0ec349583ce704699f1467dd',
			};
		}
		if (isInUsOrCa()) {
			return {
				placement: '7fdf0cd05e1d4bf39a2d3df9c61b3495',
			};
		}
		if (isInAuOrNz()) {
			return {
				placement: '5cf05e1705a2d57ba5d51e03f2af9208',
			};
		}
		// ROW
		return {
			placement: 'c1853ee8bfe0d4e935cbf2db9bb76a8b',
		};
	},
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

const smartBidder: PrebidBidder = {
	name: 'smartadserver',
	switchName: 'prebidSmart',
	bidParams: () => ({
		siteId: 465656,
		pageId: 1472549,
		formatId: 105870,
	}),
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

// There's an IX bidder for every size that the slot can take
const indexExchangeBidders = (
	slotSizes: HeaderBiddingSize[],
): PrebidBidder[] => {
	let indexSiteId = getIndexSiteId();
	// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
	// This check is to distinguish from the top-above-nav slot, which includes a leaderboard
	if (containsBillboardNotLeaderboard(slotSizes)) {
		indexSiteId = '983842';
	}

	return slotSizes.map((size) => ({
		name: 'ix',
		switchName: 'prebidIndexExchange',
		bidParams: (): PrebidIndexExchangeParams => ({
			siteId: indexSiteId,
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
): PrebidBidder[] => {
	const biddersToCheck: Array<[boolean, PrebidBidder]> = [
		[shouldIncludeCriteo(), criteoBidder(slotSizes)],
		[shouldIncludeSmart(), smartBidder],
		[shouldIncludeSonobi(), sonobiBidder(pageTargeting)],
		[shouldIncludeTrustX(), trustXBidder],
		[shouldIncludeTripleLift(), tripleLiftBidder],
		[shouldIncludeAppNexus(), appNexusBidder(pageTargeting)],
		[shouldIncludeImproveDigital(), improveDigitalBidder],
		[shouldIncludeImproveDigitalSkin(), improveDigitalSkinBidder],
		[shouldIncludeXaxis(), xaxisBidder],
		[true, pubmaticBidder(slotSizes)],
		[shouldIncludeAdYouLike(slotSizes), adYouLikeBidder],
		[shouldUseOzoneAdaptor(), ozoneClientSideBidder(pageTargeting)],
		[shouldIncludeOpenx(), openxClientSideBidder(pageTargeting)],
		[shouldIncludeKargo(), kargoBidder],
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
): PrebidBid[] =>
	currentBidders(slotSizes, pageTargeting).map((bidder: PrebidBidder) => ({
		bidder: bidder.name,
		params: bidder.bidParams(slotId, slotSizes),
	}));

export const _ = {
	getIndexSiteId,
	getXaxisPlacementId,
	getTrustXAdUnitId,
	indexExchangeBidders,
};
