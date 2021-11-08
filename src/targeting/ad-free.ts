/* -- Types -- */

import type { True } from './ad-targeting';
import { AsyncAdTargeting } from './get-set';

/**
 * #### Ad Free Targeting
 *
 * If a user has a Digital Subscription, they don’t get any ads
 */
type AdFreeTargeting = {
	/**
	 * **A**d **F**ree – [see on Ad Manager][gam]
	 *
	 * [gam]: https://admanager.google.com/59666047#inventory/custom_targeting/detail/custom_key_id=12312030
	 */
	af: True | null;
};

/* -- Methods -- */

/* -- Targeting -- */

const adFreeTargeting = new AsyncAdTargeting<AdFreeTargeting>();

const updateAdFreeTargeting = (adFree: boolean): number =>
	adFreeTargeting.set({ af: adFree ? 't' : null });

const getAdFreeTargeting = (): Promise<AdFreeTargeting> =>
	adFreeTargeting.get();

export { updateAdFreeTargeting, getAdFreeTargeting };
export type { AdFreeTargeting };
