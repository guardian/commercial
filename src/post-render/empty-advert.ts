import { log } from '@guardian/libs';
import fastdom from 'fastdom';
import type { Advert } from '../create-ads/Advert';
import { dfpEnv } from '../lib/dfp/dfp-env';

const removeFromDfpEnv = (advert: Advert) => {
	dfpEnv.adverts.delete(advert.id);
	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter((_) => _ !== advert);
};

const removeAd = (advert: Advert) => {
	const parent: HTMLElement | null = advert.node.parentElement;

	if (parent?.classList.contains('ad-slot-container')) {
		parent.remove();
	} else {
		advert.node.remove();
	}
};

const emptyAdvert = (advert: Advert): void => {
	log('commercial', `Removing empty advert: ${advert.id}`);
	fastdom.mutate(() => {
		window.googletag.destroySlots([advert.slot]);
		removeAd(advert);
		removeFromDfpEnv(advert);
	});
};

export { emptyAdvert };
