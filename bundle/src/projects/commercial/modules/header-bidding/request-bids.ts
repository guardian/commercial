import type { AdSize } from 'core/ad-sizes';
import type { Advert } from '../dfp/Advert';
import { a9 } from './a9/a9';
import { prebid } from './prebid/prebid';
import type { HeaderBiddingSlot } from './prebid-types';

// Force the refreshed advert to be the same size as the first
const retainTopAboveNavSlotSize = (
	advertSize: Advert['size'],
	hbSlot: HeaderBiddingSlot,
): HeaderBiddingSlot[] => {
	if (hbSlot.key !== 'top-above-nav') {
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

	return [
		{
			...hbSlot,
			sizes: [[advertSize[0], advertSize[1]] as AdSize],
		},
	];
};

/**
 * This is used to request bids for multiple adverts, it's possible for adverts to be passed in that have already had bids requested, this can happen if they're already in the viewport, it will only request bids for adverts that haven't already had bids requested.
 *
 * @param adverts  The adverts to request bids for
 */
export const requestBidsForAds = async (adverts: Advert[]): Promise<void> => {
	const adsToRequestBidsFor = adverts.filter(
		(advert) => !advert.headerBiddingBidRequest,
	);

	const promise = Promise.all([
		prebid.requestBids(adsToRequestBidsFor),
		a9.requestBids(adsToRequestBidsFor),
	]);

	adsToRequestBidsFor.forEach((advert) => {
		advert.headerBiddingBidRequest = promise;
	});

	await promise;
};

/**
 * This is used to request bids for a single advert. This should only be called if an ad is already in the viewport and load-advert is invoked immediately, before space-finder is finished and prebid is called for all dynamic slots.
 *
 * @param advert  The advert to request bids for
 */
export const requestBidsForAd = async (advert: Advert): Promise<void> => {
	advert.headerBiddingBidRequest = requestBidsForAds([advert]);
	await advert.headerBiddingBidRequest;
};

/**
 * This is used to refresh bids for a single advert. retainTopAboveNavSlotSize is used to force the refreshed advert to be the same size as the first
 * @param advert  The advert to refresh bids for
 **/
export const refreshBidsForAd = async (advert: Advert): Promise<void> => {
	const prebidPromise = prebid.requestBids(
		[advert],
		(prebidSlot: HeaderBiddingSlot) =>
			retainTopAboveNavSlotSize(advert.size, prebidSlot),
	);

	const a9Promise = a9.requestBids([advert], (a9Slot: HeaderBiddingSlot) =>
		retainTopAboveNavSlotSize(advert.size, a9Slot),
	);

	await Promise.all([prebidPromise, a9Promise]);
};
