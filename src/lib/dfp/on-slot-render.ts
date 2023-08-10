import { isString } from '@guardian/libs';
import type { AdSize } from 'core/ad-sizes';
import { createAdSize } from 'core/ad-sizes';
import { reportError } from 'lib/utils/report-error';
import { dfpEnv } from './dfp-env';
import { emptyAdvert } from './empty-advert';
import { getAdvertById } from './get-advert-by-id';
import { renderAdvert } from './render-advert';

const reportEmptyResponse = (
	adSlotId: string,
	event: googletag.events.SlotRenderEndedEvent,
) => {
	// This empty slot could be caused by a targeting problem,
	// let's report these and diagnose the problem in sentry.
	// Keep the sample rate low, otherwise we'll get rate-limited (report-error will also sample down)
	if (Math.random() < 1 / 10_000) {
		const adUnitPath = event.slot.getAdUnitPath();
		const adTargetingKeys = event.slot.getTargetingKeys();
		const adTargetingKValues = adTargetingKeys.includes('k')
			? event.slot.getTargeting('k')
			: [];
		const adKeywords = adTargetingKValues.join(', ');

		reportError(
			new Error('dfp returned an empty ad response'),
			{
				feature: 'commercial',
				adUnit: adUnitPath,
				adSlot: adSlotId,
				adKeywords,
			},
			false,
		);
	}
};

const sizeEventToAdSize = (size: string | number[]): AdSize | 'fluid' => {
	if (isString(size)) return 'fluid';
	return createAdSize(size[0], size[1]);
};

export const onSlotRender = (
	event: googletag.events.SlotRenderEndedEvent,
): void => {
	const advert = getAdvertById(event.slot.getSlotElementId());
	if (!advert) {
		return;
	}

	advert.isEmpty = event.isEmpty;

	if (event.isEmpty) {
		emptyAdvert(advert);
		reportEmptyResponse(advert.id, event);
		advert.finishedRendering(false);
	} else {
		/**
		 * if advert.hasPrebidSize is false we use size
		 * from the GAM event when adjusting the slot size.
		 * */
		if (!advert.hasPrebidSize && event.size) {
			advert.size = sizeEventToAdSize(event.size);
		}

		if (event.creativeId) {
			dfpEnv.creativeIDs.push(String(event.creativeId));
		}

		// Associate the line item id with the advert
		// We'll need it later when the slot becomes viewable
		// in order to determine whether we can refresh the slot
		advert.lineItemId = event.lineItemId;

		void renderAdvert(advert, event).then((isRendered) => {
			advert.finishedRendering(isRendered);
		});
	}
};
