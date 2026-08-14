import { isBoolean } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from '../messenger';

const toggleResetHeight = (fullHeight: boolean, slot: HTMLElement) =>
	fastdom.mutate(() => {
		if (fullHeight) {
			slot.classList.add('ad-slot--reset-height');
		} else {
			slot.classList.remove('ad-slot--reset-height');
		}
	});

const initResetHeightMessage = (register: RegisterListener): void => {
	register('reset-height', (specs, ret, iframe) => {
		if (iframe && specs) {
			if (!isBoolean(specs)) {
				return;
			}

			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;

			// only allow for fluid ads as these are the ones with a min-height set initially
			const isFluidAd = adSlot?.classList.contains('ad-slot--fluid');
			if (!isFluidAd || !adSlot) {
				return;
			}

			return toggleResetHeight(specs, adSlot);
		}
	});
};

export const _ = { toggleResetHeight };

export { initResetHeightMessage };
