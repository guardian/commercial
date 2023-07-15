import type { Advert } from 'lib/dfp/Advert';
import { createAdvert } from 'lib/dfp/create-advert';
import { dfpEnv } from 'lib/dfp/dfp-env';
import { displayAds } from 'lib/dfp/display-ads';
import { displayLazyAds } from 'lib/dfp/display-lazy-ads';
import { queueAdvert } from 'lib/dfp/queue-advert';
import { isInEagerPrebidVariant } from 'lib/experiments/eager-prebid-check';
import { requestBidsForAds } from '../header-bidding/request-bids';

type AdsInsertedCustomEventDetail = {
	numAdsToInsert: number;
	fromIndex: number;
};

type AdsInsertedCustomEvent = {
	detail: AdsInsertedCustomEventDetail;
};

const isCustomEvent = (event: Event): event is CustomEvent => {
	return 'detail' in event;
};

// TODO: There's lots of overlap with fill-advert-slots.ts in this function. If multiple right
// ad slots on liveblogs is what we go forward with, then refactor this to use common functions
const fillAdvertSlots = async (numAdsToInsert: number, fromIndex: number) => {
	// Create an array with the indexes of adverts that need to be created
	// This is to exclude adverts that have already been loaded
	const newAdvertIndexes = [...Array(numAdsToInsert).keys()].map(
		(i) => i + fromIndex,
	);

	const adverts = [
		...document.querySelectorAll<HTMLElement>('.ad-slot--liveblog-right'),
	]
		.filter(({ id }) =>
			// exclude ad slots that have already been filled
			newAdvertIndexes.includes(Number(id[id.length - 1])),
		)
		.map((adSlot) => createAdvert(adSlot))
		.filter((advert): advert is Advert => advert !== null);

	if (!adverts.length) return;

	const currentLength = dfpEnv.adverts.length;
	dfpEnv.adverts = dfpEnv.adverts.concat(adverts);
	adverts.forEach((advert, index) => {
		dfpEnv.advertIds[advert.id] = currentLength + index;
	});

	if (isInEagerPrebidVariant()) {
		// Request bids for all server rendered adverts
		await requestBidsForAds(adverts);
	}

	adverts.forEach(queueAdvert);
	if (dfpEnv.shouldLazyLoad()) {
		displayLazyAds();
	} else {
		displayAds();
	}
};

// When a liveblog-right ad slot is inserted into the page, create an ad in this new slot
export const initLiveblogRightAdverts = (): Promise<void> => {
	document.addEventListener('liveblog-right-ads-inserted', (event: Event) => {
		if (!isCustomEvent(event)) throw new Error('not a custom event');

		const { numAdsToInsert, fromIndex } = (<AdsInsertedCustomEvent>event)
			.detail;

		void fillAdvertSlots(numAdsToInsert, fromIndex);
	});

	return Promise.resolve();
};
