import type { SizeMapping } from '@guardian/commercial-core/ad-sizes';
import { fillDynamicAdSlot } from '../../insert/fill-dynamic-advert-slot';
import type { FillAdSlot } from '../../insert/spacefinder/article';
import { init as initSpacefinder } from '../../insert/spacefinder/article';

/**
 * Fill an ad slot with a googletag advert
 * @param name The name of the ad slot
 * @param slot The slot element
 * @param additionalSizes Additional sizes to be added to the slot
 */
const fillAdSlot: FillAdSlot = async (
	name: string,
	slot: HTMLElement,
	additionalSizes?: SizeMapping,
) => {
	await fillDynamicAdSlot(slot, false, additionalSizes);
};

/**
 * Initialise article body ad slots
 */
const initArticleBodyAdverts = () => {
	document.addEventListener('article:sign-in-gate-dismissed', () => {
		void initSpacefinder(fillAdSlot);
	});
	return initSpacefinder(fillAdSlot);
};

export { initArticleBodyAdverts };
