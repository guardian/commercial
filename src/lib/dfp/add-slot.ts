import type { SizeMapping } from 'core/ad-sizes';
import { reportError } from 'lib/utils/report-error';
import type { Advert } from './Advert';
import { createAdvert } from './create-advert';
import { dfpEnv } from './dfp-env';
import { enableLazyLoad } from './lazy-load';
import { loadAdvert } from './load-advert';
import { queueAdvert } from './queue-advert';

const displayAd = (advert: Advert, forceDisplay: boolean) => {
	dfpEnv.advertIds[advert.id] = dfpEnv.adverts.push(advert) - 1;
	if (dfpEnv.shouldLazyLoad() && !forceDisplay) {
		queueAdvert(advert);
		enableLazyLoad(advert);
	} else {
		loadAdvert(advert);
	}
};

const addSlot = (
	adSlot: HTMLElement,
	forceDisplay: boolean,
	additionalSizes?: SizeMapping,
	slotTargeting?: Record<string, string>,
): Promise<Advert | null> => {
	return new Promise((resolve) => {
		window.googletag.cmd.push(() => {
			if (!(adSlot.id in dfpEnv.advertIds)) {
				const advert = createAdvert(
					adSlot,
					additionalSizes,
					slotTargeting,
				);
				if (advert === null) return;
				// dynamically add ad slot
				displayAd(advert, forceDisplay);
				resolve(advert);
			} else {
				const errorMessage = `Attempting to add slot with exisiting id ${adSlot.id}`;
				reportError(
					Error(errorMessage),
					{
						feature: 'commercial',
						slotId: adSlot.id,
					},
					false,
				);
				console.error(errorMessage);
			}
		});
	});
};

export { addSlot };
