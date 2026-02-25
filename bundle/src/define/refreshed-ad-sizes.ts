import type { AdSize } from '@guardian/commercial-core/ad-sizes';
import type { HeaderBiddingSlot } from '../lib/header-bidding/prebid-types';
import type { Advert } from './Advert';

export const refreshedAdSizes = (
	advertSize: Advert['size'],
	hbSlot: HeaderBiddingSlot,
): HeaderBiddingSlot[] => {
	// Only top-above-nav and fronts-banner ads are currently applicable for their ad size not changing
	if (
		hbSlot.key !== 'top-above-nav' &&
		!hbSlot.key.startsWith('fronts-banner')
	) {
		return [hbSlot];
	}

	// No point forcing a size, as there is already only one possible (mobile/tablet).
	// See prebid/slot-config.js
	if (hbSlot.sizes.length === 1) {
		return [hbSlot];
	}

	// If advert.size is not an array, there is no point having this hbSlot
	if (!Array.isArray(advertSize)) {
		return [];
	}

	// Force the refreshed advert to be the same size as the first
	return [
		{
			...hbSlot,
			sizes: [[advertSize[0], advertSize[1]] as AdSize],
		},
	];
};
