/* -- Types -- */

import type { True } from '.';

/**
 * #### Ad Free Targeting
 *
 * If a user has a Digital Subscription, they don’t get any ads
 */
export type AdFreeTargeting = {
	/**
	 * **A**d **F**ree – [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=10701609
	 */
	af: True;
};

/* -- Methods -- */

/* -- Targeting -- */

export const getAdFreeTargeting = (adFree: boolean): AdFreeTargeting | null =>
	adFree ? { af: 't' } : null;
