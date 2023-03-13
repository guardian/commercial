import type { AdSize } from '@guardian/commercial-core';
import type { Advert } from '../dfp/Advert';
import { a9 } from './a9/a9';
import { prebid } from './prebid/prebid';

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

export const requestBidsForAd = async (advert: Advert): Promise<void> => {
	advert.headerBiddingBidRequest = Promise.all([
		prebid.requestBids(advert),
		a9.requestBids(advert),
	]);
	await advert.headerBiddingBidRequest;
};

export const requestBidsForAds = async (adverts: Advert[]): Promise<void> => {
	const adsToRequestBidsFor = adverts.filter(
		(advert) => !advert.headerBiddingBidRequest,
	);

	const promise = Promise.all([
		prebid.requestBidsForAds(adsToRequestBidsFor),
		a9.requestBidsForAds(adsToRequestBidsFor),
	]);

	adsToRequestBidsFor.forEach((advert) => {
		advert.headerBiddingBidRequest = promise;
	});

	await promise;
};

export const refreshBidsForAd = async (advert: Advert): Promise<void> => {
	const prebidPromise = prebid.requestBids(
		advert,
		(prebidSlot: HeaderBiddingSlot) =>
			retainTopAboveNavSlotSize(advert.size, prebidSlot),
	);

	const a9Promise = a9.requestBids(advert, (a9Slot: HeaderBiddingSlot) =>
		retainTopAboveNavSlotSize(advert.size, a9Slot),
	);

	await Promise.all([prebidPromise, a9Promise]);
};
