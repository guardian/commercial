import { isBoolean } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from '../messenger';

const fullWidth = (fullWidth: boolean, slotContainer: HTMLElement) =>
	fastdom.mutate(() => {
		if (fullWidth) {
			slotContainer.classList.add('ad-slot--full-width');
		} else {
			slotContainer.classList.remove('ad-slot--full-width');
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

			// only allow for banner ads
			const name = adSlot?.dataset.name;
			if (
				(!name?.startsWith('fronts-banner') &&
					!name?.startsWith('merchandising')) ||
				!adSlot
			) {
				return;
			}

			const slotContainer =
				iframe.closest<HTMLElement>('.ad-slot-container') ?? undefined;
			if (!slotContainer) {
				return;
			}

			return fullWidth(specs, slotContainer);
		}
	});
};

export const _ = { fullWidth };

export { init };
