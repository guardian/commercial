import fastdom from 'fastdom';
import { EventTimer } from 'core/event-timer';
import type { Advert } from '../define/Advert';
import { stripDfpAdPrefixFrom } from '../lib/header-bidding/utils';
import { refreshBidsForAd, requestBidsForAd } from './request-bids';

const eventTimer = EventTimer.get();

export const loadAdvert = (advert: Advert): void => {
	const adName = stripDfpAdPrefixFrom(advert.id);
	eventTimer.mark('adRenderStart', adName);
	// TODO can slotReady come after header bidding?
	// If so, the callbacks pushed onto the ias queue in define-slot.js
	// could be run in parallel with the calls to requestBids below, reducing the
	// total time to display the ad.
	void advert.whenSlotReady
		.catch(() => {
			// The display needs to be called, even in the event of an error.
		})
		.then(() => {
			eventTimer.mark('prepareSlotStart', adName);
			// If the advert has already had bids requested, then we don't need to request them again.
			if (advert.headerBiddingBidRequest) {
				return advert.headerBiddingBidRequest;
			}
			return requestBidsForAd(advert);
		})
		.then(() => {
			eventTimer.mark('prepareSlotEnd', adName);
			eventTimer.mark('fetchAdStart', adName);
			window.googletag.display(advert.id);
		});
};

export const refreshAdvert = (advert: Advert): void => {
	// advert.size contains the effective size being displayed prior to refreshing
	void advert.whenSlotReady
		.then(() =>
			fastdom.mutate(() => {
				if (advert.id.includes('fronts-banner')) {
					advert.node
						.closest<HTMLElement>('.ad-slot-container')
						?.classList.remove('ad-slot--full-width');
				}
			}),
		)
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
