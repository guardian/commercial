import type { AdSize } from '@guardian/commercial-core/ad-sizes';
import { createAdSize } from '@guardian/commercial-core/ad-sizes';
import { isString } from '@guardian/libs';
import fastdom from 'fastdom';
import { getAdvertById } from '../lib/dfp/get-advert-by-id';
import { reportError } from '../lib/error/report-error';
import { emptyAdvert } from './empty-advert';
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
		const targeting = event.slot.getConfig('targeting').targeting ?? {};
		const adTargetingKValues = targeting['k'] ?? [];

		const adKeywords = Array.isArray(adTargetingKValues)
			? adTargetingKValues.join(', ')
			: String(adTargetingKValues);

		reportError(
			new Error('dfp returned an empty ad response'),
			'commercial',
			{
				adUnit: adUnitPath,
				adSlot: adSlotId,
				adKeywords,
			},
		);
	}
};

const sizeEventToAdSize = (size: string | number[]): AdSize | 'fluid' => {
	if (isString(size)) return 'fluid';
	return createAdSize(Number(size[0]), Number(size[1]));
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

		// Associate the line item id with the advert
		// We'll need it later when the slot becomes viewable
		// in order to determine whether we can refresh the slot
		advert.lineItemId = event.lineItemId;
		advert.creativeId = event.creativeId;
		advert.creativeTemplateId = event.creativeTemplateId;

		void renderAdvert(advert, event).then((isRendered) => {
			advert.finishedRendering(isRendered);
			// log the ad size after display
			fastdom.measure(() => {
				const parentElement = advert.node.parentElement;
				if (!parentElement) return;

				const adElementHeight = advert.node.offsetHeight;
				const adElementWidth = advert.node.offsetWidth;
				const parentHeight = parentElement.offsetHeight;
				const parentWidth = parentElement.offsetWidth;

				const isInline = advert.node.id.includes('dfp-ad--inline');

				if (
					adElementWidth > parentWidth ||
					adElementHeight > parentHeight ||
					// Note: this is an experiment to determine which element is
					// causing issues with the right ad slot (as well as other ads).
					// We can remove this check once we have enough data.
					(isInline && adElementWidth > 300)
				) {
					reportError(
						new Error('Ad is overflowing its container'),
						'commercial',
						{},
						{
							adHeight: adElementHeight,
							adId: advert.node.id,
							adSize: advert.size,
							adWidth: adElementWidth,
							containerHeight: parentHeight,
							containerWidth: parentWidth,
							creativeId: advert.creativeId,
							creativeTemplateId: advert.creativeTemplateId,
							lineItemId: advert.lineItemId,
						},
					);
				}
			});
		});
	}
};
