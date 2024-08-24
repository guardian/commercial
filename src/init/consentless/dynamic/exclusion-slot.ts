import { createAdSlot } from 'core/create-ad-slot';
import fastdom from 'utils/fastdom-promise';
import { defineSlot } from '../define-slot';

/**
 * This is responsible for inserting an _exclusion_ ad slot into the DOM
 *
 * This is a special type of ad which, when filled, blocks
 * all other ads on the page. This allows us to run "exclusion
 * campaigns" against certain breaking news pages.
 *
 * Exclusion ads are used for consentless advertising only.
 * GAM has a different mechanism to achieve the same thing.
 */
const initExclusionSlot = async (): Promise<void> => {
	const adSlot = createAdSlot('exclusion');

	// Insert the slot into the body of the page
	// It doesn't particularly matter where we insert it, since it doesn't render anything
	await fastdom.mutate(() => document.body.appendChild(adSlot));

	defineSlot(adSlot, 'exclusion');
};

export { initExclusionSlot };
