import { log } from '@guardian/libs';
import fastdom from 'fastdom';
import type { Advert } from '../define/Advert';
import { dfpEnv } from '../lib/dfp/dfp-env';

const removeFromDfpEnv = (advert: Advert) => {
	dfpEnv.adverts.delete(advert.id);
	dfpEnv.advertsToLoad = dfpEnv.advertsToLoad.filter((_) => _ !== advert);
};

/**
 * Find the highest element responsible for the advert.
 *
 * Sometimes an advert has an advert container as a direct parent
 * Sometimes that container has a top-level container ancestor
 */
const findElementToRemove = (advertNode: HTMLElement): HTMLElement => {
	const parent = advertNode.parentElement;
	const isAdContainer =
		parent instanceof HTMLElement &&
		parent.classList.contains('ad-slot-container');

	if (!isAdContainer) {
		return advertNode;
	}

	const topLevelContainer = parent.closest<HTMLElement>(
		'.top-fronts-banner-ad-container, .top-banner-ad-container',
	);

	if (!topLevelContainer) {
		return parent;
	}

	return topLevelContainer;
};

const removeSlotFromDom = (slotElement: HTMLElement) => {
	const elementToRemove = findElementToRemove(slotElement);
	elementToRemove.remove();
};

const emptyAdvert = (advert: Advert): void => {
	log('commercial', `Removing empty advert: ${advert.id}`);
	fastdom.mutate(() => {
		window.googletag.destroySlots([advert.slot]);
		removeSlotFromDom(advert.node);
		removeFromDfpEnv(advert);
	});
};

export { emptyAdvert, removeSlotFromDom };

export const _ = {
	findElementToRemove,
};
