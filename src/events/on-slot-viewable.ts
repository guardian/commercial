import { log } from '@guardian/libs';
import { EventTimer } from 'core';
import { outstreamSizes } from 'core/ad-sizes';
import { AD_LABEL_HEIGHT } from 'core/constants/ad-label-height';
import fastdom from 'utils/fastdom-promise';
import { getUrlVars } from 'utils/url';
import type { Advert } from '../define/Advert';
import { isAdSize } from '../define/Advert';
import { enableLazyLoad } from '../display/lazy-load';
import { getAdvertById } from '../lib/dfp/get-advert-by-id';
import { memoizedFetchNonRefreshableLineItemIds } from '../lib/dfp/non-refreshable-line-items';
import { shouldRefresh } from '../lib/dfp/should-refresh';

const ADVERT_REFRESH_RATE = 30_000; // 30 seconds. The minimum time allowed by Google.

/**
 * Prevent CLS when an advert is refreshed, by setting the
 * min-height of the ad slot to the height of the ad.
 */
const setAdSlotMinHeight = (advert: Advert): void => {
	// We need to know the height of the ad to set the min-height
	if (!isAdSize(advert.size)) {
		return;
	}

	const { size, node } = advert;

	// When a passback occurs, a new ad slot is created within the original ad slot.
	// We don't want to set a min-height on the parent ad slot, as the child ad slot
	// may load an ad size that we are not aware of at this point. It may be shorter,
	// which would make the min-height we set here too high.
	// Therefore it is safer to exclude ad slots where a passback may occur.
	const canSlotBePassedBack = Object.values(outstreamSizes).some(
		({ width, height }) => width === size.width && height === size.height,
	);
	if (canSlotBePassedBack) {
		return;
	}

	const isStandardAdSize = !size.isProxy();
	if (isStandardAdSize) {
		void fastdom
			.measure(() => node.getAttribute('data-label') === 'true')
			.then((hasLabel) => {
				const labelHeight = hasLabel ? AD_LABEL_HEIGHT : 0;
				void fastdom.mutate(() => {
					const adSlotHeight = size.height + labelHeight;
					node.style.minHeight = `${adSlotHeight}px`;
				});
			});
	} else {
		// For the situation when we load a non-standard size ad, e.g. fluid ad, after
		// previously loading a standard size ad. Ensure that the previously added min-height is
		// removed, so that a smaller fluid ad does not have a min-height larger than it is.
		void fastdom.mutate(() => {
			node.style.minHeight = '';
		});
	}
};

const setSlotAdRefresh = (
	event: googletag.events.ImpressionViewableEvent,
): void => {
	const advert = getAdvertById(event.slot.getSlotElementId());
	if (!advert) {
		return;
	}

	void setAdSlotMinHeight(advert);

	// Call the memoized function so we only retrieve the value from the API once
	void memoizedFetchNonRefreshableLineItemIds()
		.then((nonRefreshableLineItemIds) => {
			// Determine whether ad should refresh
			// This value will then be checked when the timer has elapsed and
			// we want to know whether to refresh
			advert.shouldRefresh = shouldRefresh(
				advert,
				nonRefreshableLineItemIds,
			);
		})
		.catch((error) => {
			log(
				'commercial',
				'⚠️ Error fetching non-refreshable line items',
				error,
			);
		});

	const viewabilityThresholdMs = ADVERT_REFRESH_RATE;

	// Event listener that will load an advert once a document becomes visible
	const onDocumentVisible = () => {
		if (!document.hidden) {
			document.removeEventListener('visibilitychange', onDocumentVisible);
			enableLazyLoad(advert);
		}
	};

	setTimeout(() => {
		// During the elapsed time, a 'disable-refresh' message may have been posted.
		// Check the flag again.
		if (!advert.shouldRefresh) {
			return;
		}
		// If the document is hidden don't refresh immediately
		// Instead add an event listener to refresh when document becomes visible again
		if (document.hidden) {
			document.addEventListener('visibilitychange', onDocumentVisible);
		} else {
			enableLazyLoad(advert);
		}
	}, viewabilityThresholdMs);
};

/*
  Returns a function to be used as a callback for GTP 'impressionViewable' event
  Uses URL parameters.
 */
const onSlotViewableFunction = (): ((
	event: googletag.events.ImpressionViewableEvent,
) => void) => {
	const queryParams = getUrlVars();

	return (event: googletag.events.ImpressionViewableEvent) => {
		const slot = event.slot.getTargeting('slot')[0];
		EventTimer.get().mark('viewable', slot);
		log('commercial', 'Slot viewable', slot);
		if (queryParams.adrefresh !== 'false') {
			setSlotAdRefresh(event);
		}
	};
};

export { onSlotViewableFunction };
