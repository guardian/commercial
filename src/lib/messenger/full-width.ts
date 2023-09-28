import { isBoolean } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from 'core/messenger';

const fullWidth = (fullWidth: boolean, slot: HTMLElement) =>
	fastdom.mutate(() => {
		if (fullWidth) {
			slot.classList.add('ad-slot--full-width');
		} else {
			slot.classList.remove('ad-slot--full-width');
		}
	});

const init = (register: RegisterListener): void => {
	register('full-width', (specs, ret, iframe) => {
		if (iframe && specs) {
			if (!isBoolean(specs)) {
				return;
			}
			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;

			const name = adSlot?.dataset.name;

			// only allow for banner ads
			if (!name?.startsWith('fronts-banner') || !adSlot) {
				return;
			}

			return fullWidth(specs, adSlot);
		}
	});
};

export const _ = { fullWidth };

export { init };
