import { isNonNullable } from '@guardian/libs';
import fastdom from 'fastdom';
import { fillDynamicAdSlot } from 'lib/dfp/fill-dynamic-advert-slot';
import { isInVariantSynchronous } from 'lib/experiments/ab';
import { liveblogRightColumnAds } from 'lib/experiments/tests/liveblog-right-column-ads';

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
const fillAdvertSlots = (newAdvertIndexes?: number[]) => {
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
		await fillDynamicAdSlot(advert, false);
	});
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
