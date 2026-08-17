import { isBoolean, log } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from '../messenger';

const toggleResetHeight = (reset: boolean, slot: HTMLElement) =>
	fastdom.mutate(() => {
		if (reset) {
			log(
				'commercial',
				`[reset-height] resetting the height for slot: ${slot.dataset.name}`,
			);
			slot.classList.add('ad-slot--reset-height');
		} else {
			log(
				'commercial',
				`[reset-height] removing the height reset for slot: ${slot.dataset.name}`,
			);
			slot.classList.remove('ad-slot--reset-height');
		}
	});

const initResetHeightMessage = (register: RegisterListener): void => {
	register('reset-height', (specs, ret, iframe) => {
		if (iframe && specs) {
			if (!isBoolean(specs)) {
				log(
					'commercial',
					'[reset-height] incorrect message payload: expected a boolean',
				);
				return;
			}

			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;

			// only allow for fluid ads as these are the ones with a min-height set initially
			const isFluidAd = adSlot?.classList.contains('ad-slot--fluid');
			if (!isFluidAd || !adSlot) {
				log(
					'commercial',
					'[reset-height] cannot reset height: no ad slot identified or not a fluid ad',
				);
				return;
			}

			return toggleResetHeight(specs, adSlot);
		}
	});
};

export const _ = { toggleResetHeight };

export { initResetHeightMessage };
