import type { SizeMapping } from '@guardian/commercial-core/ad-sizes';
import { log } from '@guardian/libs';
import type { Advert } from '../define/Advert';
import { createAdvert } from '../define/create-advert';
import { enableLazyLoad } from '../display/lazy-load';
import { loadAdvert } from '../display/load-advert';
import { dfpEnv } from '../lib/dfp/dfp-env';
import { queueAdvert } from '../lib/dfp/queue-advert';

const displayAd = (advert: Advert, forceDisplay: boolean) => {
	if (dfpEnv.shouldLazyLoad() && !forceDisplay) {
		queueAdvert(advert);
		enableLazyLoad(advert);
	} else {
		loadAdvert(advert);
	}
};

const fillDynamicAdSlot = (
	adSlot: HTMLElement,
	forceDisplay: boolean,
	additionalSizes?: SizeMapping,
	slotTargeting?: Record<string, string>,
): Promise<Advert | null> => {
	return new Promise((resolve) => {
		window.googletag.cmd.push(() => {
			// Don't recreate an advert if one has already been created for this slot
			if (dfpEnv.adverts.has(adSlot.id)) {
				const errorMessage = `Attempting to add slot with exisiting id ${adSlot.id}`;
				log('commercial', errorMessage);
				return;
			}

			const advert = createAdvert(adSlot, additionalSizes, slotTargeting);
			if (advert === null) return;

			dfpEnv.adverts.set(advert.id, advert);
			displayAd(advert, forceDisplay);

			resolve(advert);
		});
	});
};

export { fillDynamicAdSlot };
