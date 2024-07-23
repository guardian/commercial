import { isInAuOrNz, isInRow, isInUk, isInUsOrCa } from 'utils/geo-utils';
import type { HeaderBiddingSize } from '../prebid-types';
import {
	containsBillboard,
	containsLeaderboardOrBillboard,
	containsMobileSticky,
	containsMpu,
	containsMpuOrDmpu,
	containsPortraitInterstitial,
	containsWS,
	getBreakpointKey,
} from '../utils';

export const getMagniteZoneId = (
	slotId: string,
	sizes: HeaderBiddingSize[],
): number => {
	if (isInUk()) {
		switch (getBreakpointKey()) {
			case 'D':
				if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
					return 3426780;
				}
				// top-above-nav on desktop
				if (
					containsLeaderboardOrBillboard(sizes) &&
					slotId === 'dfp-ad--top-above-nav'
				) {
					return 3426786;
				}
				// Fronts-banners on desktop
				if (
					containsBillboard(sizes) &&
					slotId.includes('fronts-banner')
				) {
					return 3426790;
				}
				break;
			case 'M':
				if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
					return 3426778;
				}
				break;
			default:
				return -1;
		}
	}

	if (isInRow()) {
		switch (getBreakpointKey()) {
			case 'D':
				if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
					return 3426822;
				}
				// top-above-nav on desktop
				if (
					containsLeaderboardOrBillboard(sizes) &&
					slotId === 'dfp-ad--top-above-nav'
				) {
					return 3426828;
				}
				// Fronts-banners on desktop
				if (
					containsBillboard(sizes) &&
					slotId.includes('fronts-banner')
				) {
					return 3426834;
				}
				break;
			case 'M':
				if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
					return 3426836;
				}
				if (containsMobileSticky(sizes)) {
					return 3477560;
				}
				break;
			default:
				return -1;
		}
	}

	if (isInUsOrCa()) {
		switch (getBreakpointKey()) {
			case 'D':
				if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
					return 3471422;
				}
				// top-above-nav on desktop
				if (
					containsLeaderboardOrBillboard(sizes) &&
					slotId === 'dfp-ad--top-above-nav'
				) {
					return 3471428;
				}
				// Fronts-banners on desktop
				if (
					containsBillboard(sizes) &&
					slotId.includes('fronts-banner')
				) {
					return 3471434;
				}
				break;
			case 'M':
				if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
					return 3471436;
				}
				if (containsMobileSticky(sizes)) {
					return 3471440;
				}
				break;
			default:
				return -1;
		}
	}

	if (isInAuOrNz()) {
		switch (getBreakpointKey()) {
			case 'D':
				if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
					return 3471452;
				}
				// top-above-nav on desktop
				if (
					containsLeaderboardOrBillboard(sizes) &&
					slotId === 'dfp-ad--top-above-nav'
				) {
					return 3471458;
				}
				// Fronts-banners on desktop
				if (
					containsBillboard(sizes) &&
					slotId.includes('fronts-banner')
				) {
					return 3471462;
				}
				break;
			case 'M':
				if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
					return 3471464;
				}
				if (containsMobileSticky(sizes)) {
					return 3471468;
				}
				break;
			default:
				return -1;
		}
	}
	return -1;
};

export const getMagniteSiteId = (): number => {
	if (isInUk()) {
		switch (getBreakpointKey()) {
			case 'D':
				return 549358;
			case 'M':
				return 549374;
		}
	}

	if (isInRow()) {
		switch (getBreakpointKey()) {
			case 'D':
				return 549496;
			case 'M':
				return 549498;
		}
	}

	if (isInUsOrCa()) {
		switch (getBreakpointKey()) {
			case 'D':
				return 554244;
			case 'M':
				return 554248;
		}
	}

	if (isInAuOrNz()) {
		switch (getBreakpointKey()) {
			case 'D':
				return 554256;
			case 'M':
				return 554258;
		}
	}
	return -1;
};
