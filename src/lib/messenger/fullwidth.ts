import { isObject } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from 'core/messenger';

interface FullwidthSpecs {
	fullwidth: boolean;
}

const isFullwidthSpecs = (specs: unknown): specs is FullwidthSpecs =>
	!!specs && isObject(specs) && 'fullwidth' in specs;

const fullwidth = (specs: FullwidthSpecs, slotContainer: HTMLElement) =>
	fastdom.mutate(() => {
		if (specs.fullwidth) {
			slotContainer.classList.add('ad-slot-container--fullwidth');
		} else {
			slotContainer.classList.remove('ad-slot-container--fullwidth');
		}
	});

const init = (register: RegisterListener): void => {
	register('fullwidth', (specs, ret, iframe) => {
		if (iframe && specs) {
			if (!isFullwidthSpecs(specs)) {
				return;
			}
			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;

			const name = adSlot?.dataset.name;

			// only allow for banner ads
			if (!name?.startsWith('fronts-banner')) {
				return;
			}

			const slotContainer =
				iframe.closest<HTMLElement>('.ad-slot-container') ?? undefined;

			if (!slotContainer) {
				return;
			}

			return fullwidth(specs, slotContainer);
		}
	});
};

export const _ = { fullwidth };

export { init };
