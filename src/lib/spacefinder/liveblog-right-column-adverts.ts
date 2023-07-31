import { isNonNullable } from '@guardian/libs';
import fastdom from 'fastdom';
import type { Advert } from 'lib/dfp/Advert';
import { fillDynamicAdSlot } from 'lib/dfp/fill-dynamic-advert-slot';
import { isInVariantSynchronous } from 'lib/experiments/ab';
import { isInEagerPrebidVariant } from 'lib/experiments/eager-prebid-check';
import { liveblogRightColumnAds } from 'lib/experiments/tests/liveblog-right-column-ads';
import { requestBidsForAds } from '../header-bidding/request-bids';

type AdsInsertedCustomEventDetail = {
	numAdsToInsert: number;
	fromIndex: number;
};

type AdsInsertedCustomEvent = {
	detail: AdsInsertedCustomEventDetail;
};

const insertedAdverts: Advert[] = [];

const isCustomEvent = (event: Event): event is CustomEvent => {
	return 'detail' in event;
};

// TODO: There's lots of overlap with fill-advert-slots.ts in this function. If multiple right
// ad slots on liveblogs is what we go forward with, then refactor this to use common functions
const fillAdvertSlots = async (newAdvertIndexes?: number[]) => {
	const adSlots = [
		...document.querySelectorAll<HTMLElement>('.ad-slot--liveblog-right'),
	]
		.filter(({ id }) => {
			// exclude ad slots that have already been filled
			if (newAdvertIndexes?.length) {
				return newAdvertIndexes.includes(Number(id[id.length - 1]));
			}

			return true;
		})
		.filter((advert) => isNonNullable(advert));

	if (!adSlots.length) return;

	adSlots.map(async (advert) => {
		await fillDynamicAdSlot(advert, false).then((advert) => {
			if (advert) {
				insertedAdverts.push(advert);
			}
		});
	});

	if (isInEagerPrebidVariant()) {
		// Request bids for all server rendered adverts
		await requestBidsForAds(insertedAdverts);
	}
};

const createLiveblogRightAdverts = () => {
	void fillAdvertSlots();

	document.addEventListener('liveblog-right-ads-inserted', (event: Event) => {
		if (!isCustomEvent(event)) throw new Error('not a custom event');

		const { numAdsToInsert, fromIndex } = (<AdsInsertedCustomEvent>event)
			.detail;

		// Create an array with the indexes of adverts that need to be created
		// This is to exclude adverts that have already been loaded
		const newAdvertIndexes = [...Array(numAdsToInsert).keys()].map(
			(i) => i + fromIndex,
		);

		void fillAdvertSlots(newAdvertIndexes);
	});
};

const restrictRightAdContainerHeight = (): void => {
	fastdom.measure(() => {
		const rightAdContainer =
			document.querySelector<HTMLElement>('#top-right-ad-slot');

		if (rightAdContainer !== null) {
			fastdom.mutate(() => {
				rightAdContainer.style.maxHeight = '1059px';
			});
		}
	});
};

// When a liveblog-right ad slot is inserted into the page, create an ad in this new slot
export const initLiveblogRightColumnAdverts = async (): Promise<void> => {
	const isInMultipleAdsVariant = isInVariantSynchronous(
		liveblogRightColumnAds,
		'multiple-adverts',
	);
	const isInMinStickinessVariant = isInVariantSynchronous(
		liveblogRightColumnAds,
		'minimum-stickiness',
	);

	// Don't insert extra ads if not in the multiple-adverts variant of the liveblogRightColumnAds AB test.
	if (isInMultipleAdsVariant) {
		void createLiveblogRightAdverts();
	}

	if (isInMultipleAdsVariant || isInMinStickinessVariant) {
		void restrictRightAdContainerHeight();
	}

	return Promise.resolve();
};
