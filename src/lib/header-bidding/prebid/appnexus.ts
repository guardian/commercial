import { isInAuOrNz, isInRow } from '../../../lib/geo/geo-utils';
import type { PageTargeting } from '../../../lib/targeting/build-page-targeting';
import { buildAppNexusTargetingObject } from '../../page-targeting';
import type { HeaderBiddingSize } from '../prebid-types';
import {
	containsBillboardNotLeaderboard,
	containsLeaderboard,
	containsLeaderboardOrBillboard,
	containsMobileSticky,
	containsMpu,
	containsMpuOrDmpu,
	getBreakpointKey,
	getLargestSize,
} from '../utils';

type AppNexusDirectBidParams =
	| {
			invCode: string;
			member: string;
			keywords: {
				invc: [string];
			} & PageTargeting;
	  }
	| { placementId: string; keywords: PageTargeting };

const getAppNexusInvCode = (sizes: HeaderBiddingSize[]): string | undefined => {
	const device = getBreakpointKey() === 'M' ? 'M' : 'D';
	// section is optional and makes it through to the config object as an empty string... OTL
	const sectionName =
		window.guardian.config.page.section ||
		window.guardian.config.page.sectionName.replace(/ /g, '-');

	const slotSize = getLargestSize(sizes);
	if (slotSize) {
		return `${device}${sectionName.toLowerCase()}${slotSize.join('x')}`;
	}
};

export const getAppNexusDirectPlacementId = (
	sizes: HeaderBiddingSize[],
): string => {
	if (isInAuOrNz()) {
		return '11016434';
	}

	if (isInRow() && containsMobileSticky(sizes)) {
		return '31512573';
	}

	const defaultPlacementId = '9251752';
	switch (getBreakpointKey()) {
		case 'D':
			// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
			// This check is to distinguish from the top-above-nav which includes a leaderboard
			if (containsBillboardNotLeaderboard(sizes)) {
				return '30017511';
			}
			if (containsMpuOrDmpu(sizes)) {
				return '9251752';
			}
			if (containsLeaderboardOrBillboard(sizes)) {
				return '9926678';
			}
			return defaultPlacementId;
		case 'M':
			if (containsMpu(sizes)) {
				return '4298191';
			}
			return defaultPlacementId;
		case 'T':
			if (containsMpu(sizes)) {
				return '4371641';
			}
			if (containsLeaderboard(sizes)) {
				return '4371640';
			}
			return defaultPlacementId;
		default:
			return defaultPlacementId;
	}
};

export const getAppNexusDirectBidParams = (
	sizes: HeaderBiddingSize[],
	pageTargeting: PageTargeting,
	slotId: string,
): AppNexusDirectBidParams => {
	if (isInAuOrNz() && window.guardian.config.switches.prebidAppnexusInvcode) {
		const invCode = getAppNexusInvCode(sizes);
		if (invCode) {
			return {
				invCode,
				member: '7012',
				keywords: {
					invc: [invCode],
					...buildAppNexusTargetingObject(pageTargeting),
					slot: slotId,
				},
			};
		}
	}
	return {
		placementId: getAppNexusDirectPlacementId(sizes),
		keywords: {
			...buildAppNexusTargetingObject(pageTargeting),
			slot: slotId,
		},
	};
};

export const _ = { getAppNexusDirectPlacementId };
