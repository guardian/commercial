import fastdom from 'fastdom';
import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';

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
	fastdom.mutate(() => {
		window.googletag.destroySlots([advert.slot]);
		removeAd(advert);
		removeFromDfpEnv(advert);
	});
};

export { emptyAdvert };
