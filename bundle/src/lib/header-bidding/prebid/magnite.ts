import {
	isInAuOrNz,
	isInRow,
	isInUk,
	isInUsOrCa,
} from '@guardian/commercial/geo/geo-utils';
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
	switch (getBreakpointKey()) {
		case 'D':
			if (containsMpuOrDmpu(sizes) || containsWS(sizes)) {
				if (isInUk()) {
					return 3426780;
				} else if (isInRow()) {
					return 3426822;
				} else if (isInUsOrCa()) {
					return 3471422;
				} else if (isInAuOrNz()) {
					return 3471452;
				}
			}
			// top-above-nav on desktop
			if (
				containsLeaderboardOrBillboard(sizes) &&
				slotId === 'dfp-ad--top-above-nav'
			) {
				if (isInUk()) {
					return 3426786;
				} else if (isInRow()) {
					return 3426828;
				} else if (isInUsOrCa()) {
					return 3471428;
				} else if (isInAuOrNz()) {
					return 3471458;
				}
			}
			// Fronts-banners on desktop
			if (containsBillboard(sizes) && slotId.includes('fronts-banner')) {
				if (isInUk()) {
					return 3426790;
				} else if (isInRow()) {
					return 3426834;
				} else if (isInUsOrCa()) {
					return 3471434;
				} else if (isInAuOrNz()) {
					return 3471462;
				}
			}
			break;
		case 'M':
			if (containsMpu(sizes) || containsPortraitInterstitial(sizes)) {
				if (isInUk()) {
					return 3426778;
				} else if (isInRow()) {
					return 3426836;
				} else if (isInUsOrCa()) {
					return 3471436;
				} else if (isInAuOrNz()) {
					return 3471464;
				}
			}
			if (containsMobileSticky(sizes)) {
				if (isInRow()) {
					return 3477560;
				} else if (isInUsOrCa()) {
					return 3471440;
				} else if (isInAuOrNz()) {
					return 3471468;
				}
			}
			break;
	}
	return -1;
};

export const getMagniteSiteId = (): number => {
	switch (getBreakpointKey()) {
		case 'D':
			if (isInUk()) {
				return 549358;
			} else if (isInRow()) {
				return 549496;
			} else if (isInUsOrCa()) {
				return 554244;
			} else if (isInAuOrNz()) {
				return 554256;
			}
			break;
		case 'M':
			if (isInUk()) {
				return 549374;
			} else if (isInRow()) {
				return 549498;
			} else if (isInUsOrCa()) {
				return 554248;
			} else if (isInAuOrNz()) {
				return 554258;
			}
			break;
	}
	return -1;
};
