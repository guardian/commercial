import { once } from 'lodash-es';
import { isAdFree } from '../../lib/ad-free';
import { removeSlots } from './remove-slots';

/**
 * If the user is ad-free, remove all ad slots on the page,
 * as the ad slots are still left on the page on fronts, and mostpop on articles
 */

const removeAdFreeSlots = () => {
	if (!isAdFree()) {
		return Promise.resolve();
	}

	return removeSlots();
};

const adFreeSlotRemove = once(removeAdFreeSlots);

export { adFreeSlotRemove };

export const _ = {
	removeAdFreeSlots,
};
