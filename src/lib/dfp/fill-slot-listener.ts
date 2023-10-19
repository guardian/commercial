import { dfpEnv } from './dfp-env';
import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

type ExternalSlotCustomEvent = CustomEvent<{
	slotId: string;
}>;

const isCustomEvent = (event: Event): event is CustomEvent => {
	return 'detail' in event;
};

/**
 * Listen for events to fill an additional slot
 *
 * This is for slots that are not fixed (aka SSR) or dynamic (aka injected from
 * this bundle, e.g. via spacefinder). They are placed on the page by a
 * non-standard route, for example in a thrasher or some other async process
 * that adds the slot at an unknown time but still expects the commercial
 * runtime to fulfill the slot.
 *
 * The extra logic in addition to dynamic slots covers when:
 * - the commercial runtime loads before the slot so we wait for a custom event
 * - the commercial runtime loads after the slot so we fill the slot immediately
 *
 * These events will not be received from a restricted iframe such, such as a
 * cross-origin or safeframe iframe.
 */
export const createSlotFillListener = () => {
	document.addEventListener('gu.commercial.slot.fill', (event: Event) => {
		if (isCustomEvent(event)) {
			const { slotId } = (<ExternalSlotCustomEvent>event).detail;

			if (slotId in dfpEnv.advertIds) {
				return;
			}

			const slot = document.getElementById(slotId);
			if (slot) {
				void fillDynamicAdSlot(slot, false);
			}
		}
	});
};
