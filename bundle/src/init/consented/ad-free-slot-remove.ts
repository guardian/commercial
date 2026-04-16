import { once } from 'lodash-es';
import { isAdFree } from '../../lib/ad-free';
import { removeSlots } from './remove-slots';

/**
 * If the user is ad-free, remove all ad slots on the page,
 * as the ad slots are still left on the page on fronts, and mostpop on articles
 */

const adFree = () => isAdFree();
const adFreeSlotRemove = once(() => {
	if (!adFree()) {
		return Promise.resolve();
	}

	return removeSlots();
});

export { adFreeSlotRemove, adFree };
