import { isInRow, isInUk } from 'utils/geo-utils';
import type { HeaderBiddingSize } from '../prebid-types';
import {
	containsBillboardNotLeaderboard,
	containsLeaderboardOrBillboard,
	containsMpuOrDmpu,
	getBreakpointKey,
	stripMobileSuffix,
	stripTrailingNumbersAbove1,
} from '../utils';

const getImprovePlacementId = (sizes: HeaderBiddingSize[]): number => {
	if (isInUk()) {
		switch (getBreakpointKey()) {
			case 'D': // Desktop
				// The only prebid compatible size for fronts-banner-ads and the merchandising-high is the billboard (970x250)
				// This check is to distinguish from the top-above-nav which includes a leaderboard
				if (containsBillboardNotLeaderboard(sizes)) {
					return 22987847;
				}
				if (containsMpuOrDmpu(sizes)) {
					return 1116396;
				}
				if (containsLeaderboardOrBillboard(sizes)) {
					return 1116397;
				}
				return -1;
			case 'M': // Mobile
				if (containsMpuOrDmpu(sizes)) {
					return 1116400;
				}
				return -1;
			case 'T': // Tablet
				if (containsMpuOrDmpu(sizes)) {
					return 1116398;
				}
				if (containsLeaderboardOrBillboard(sizes)) {
					return 1116399;
				}
				return -1;
			default:
				return -1;
		}
	}
	if (isInRow()) {
		switch (getBreakpointKey()) {
			case 'D': // Desktop
				if (containsMpuOrDmpu(sizes)) {
					return 1116420;
				}
				if (containsLeaderboardOrBillboard(sizes)) {
					return 1116421;
				}
				return -1;
			case 'M': // Mobile
				if (containsMpuOrDmpu(sizes)) {
					return 1116424;
				}
				return -1;
			case 'T': // Tablet
				if (containsMpuOrDmpu(sizes)) {
					return 1116422;
				}
				if (containsLeaderboardOrBillboard(sizes)) {
					return 1116423;
				}
				return -1;
			default:
				return -1;
		}
	}
	return -1;
};

const getImproveSkinPlacementId = (): number => {
	if (isInUk()) {
		switch (getBreakpointKey()) {
			case 'D': // Desktop
				return 22526482;
			default:
				return -1;
		}
	}
	if (isInRow()) {
		switch (getBreakpointKey()) {
			case 'D': // Desktop
				return 22526483;
			default:
				return -1;
		}
	}
	return -1;
};

// Improve has to have single size as parameter if slot doesn't accept multiple sizes,
// because it uses same placement ID for multiple slot sizes and has no other size information
const getImproveSizeParam = (
	slotId: string,
	isDesktopAndArticle: boolean,
): {
	w?: number;
	h?: number;
} => {
	const key = stripTrailingNumbersAbove1(stripMobileSuffix(slotId));
	return key &&
		(key.endsWith('mostpop') ||
			key.endsWith('comments') ||
			key.endsWith('inline1') ||
			(key.endsWith('inline') && !isDesktopAndArticle))
		? {
				w: 300,
				h: 250,
		  }
		: {};
};

export {
	getImprovePlacementId,
	getImproveSizeParam,
	getImproveSkinPlacementId,
};
