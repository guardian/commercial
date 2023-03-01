import type { AdSize } from '@guardian/commercial-core';
import { EventTimer } from '@guardian/commercial-core';
import { requestBidsForAd } from '../header-bidding/request-bids';
import { stripDfpAdPrefixFrom } from '../header-bidding/utils';
import type { Advert } from './Advert';

const eventTimer = EventTimer.get();

export const loadAdvert = (advert: Advert): void => {
	const adName = stripDfpAdPrefixFrom(advert.id);
	// TODO can slotReady come after header bidding?
	// If so, the callbacks pushed onto the ias queue in define-slot.js
	// could be run in parallel with the calls to requestBids below, reducing the
	// total time to display the ad.
	void advert.whenSlotReady
		.catch(() => {
			// The display needs to be called, even in the event of an error.
		})
		.then(() => {
			eventTimer.trigger('slotReady', adName);
			return requestBidsForAd(advert);
		})
		.then(() => {
			eventTimer.trigger('slotInitialised', adName);
			window.googletag.display(advert.id);
		});
};

export const refreshAdvert = (advert: Advert): void => {
	// advert.size contains the effective size being displayed prior to refreshing
	void advert.whenSlotReady
		.then(() => {
			return refreshBidsForAd(advert);
		})
		.then(() => {
			advert.slot.setTargeting('refreshed', 'true');

			if (advert.id === 'dfp-ad--top-above-nav') {
				// force the slot sizes to be the same as advert.size (current)
				// only when advert.size is an array (forget 'fluid' and other specials)
				if (Array.isArray(advert.size)) {
					const mapping = window.googletag.sizeMapping();
					mapping.addSize(
						[0, 0],
						advert.size as googletag.GeneralSize,
					);
					advert.slot.defineSizeMapping(mapping.build());
				}
			}

			window.googletag.pubads().refresh([advert.slot]);
		});
};
