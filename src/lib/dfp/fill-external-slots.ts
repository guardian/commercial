/**
 * External slots are a special type of dynamic slot.
 *
 * They are not fixed (aka SSR) or dynamic (aka injected by spacefinder).
 * They are placed on the page by a non-standard route for example in a thrasher or some
 * other async process that adds the slot at an unknown time but still expects the
 * commercial runtime to fulfill the slot.
 *
 * The extra logic in addition to dynamic slots covers when:
 * - the commercial runtime loads before the slot so we wait for a custom event
 * - the commercial runtime loads after the slot so we fill the slot immediately
 *
 * External slots will not work from within a restricted iframe such as a
 * cross-origin or safeframe iframe.
 */

import { fillDynamicAdSlot } from './fill-dynamic-advert-slot';

const EXTERNAL_SLOT_PREFIX = 'dfp-ad--external';

type ExternalSlotCustomEventDetail = {
	slotId: string;
};

type ExternalSlotCustomEvent = {
	detail: ExternalSlotCustomEventDetail;
};

const isCustomEvent = (event: Event): event is CustomEvent => {
	return 'detail' in event;
};

const fillExternalSlots = () => {
	const externalSlots = document.querySelectorAll<HTMLElement>(
		`[id^=${EXTERNAL_SLOT_PREFIX}]`,
	);
	return [...externalSlots].map((slot) => fillDynamicAdSlot(slot, false));
};

const createSlotFillListener = () => {
	document.addEventListener('gu.commercial.slot.fill', (event: Event) => {
		if (isCustomEvent(event)) {
			const { slotId } = (<ExternalSlotCustomEvent>event).detail;
			const slot = document.getElementById(slotId);
			if (slot) {
				void fillDynamicAdSlot(slot, false);
			}
		}
	});
};

const init = () => {
	return new Promise<void>((resolve) => {
		fillExternalSlots();
		createSlotFillListener();
		resolve();
	});
};

export { init };
