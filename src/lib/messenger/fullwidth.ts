import { isObject } from '@guardian/libs';
import fastdom from 'fastdom';
import type { RegisterListener } from 'core/messenger';

interface FullwidthSpecs {
	fullwidth: boolean;
}

const isFullwidthSpecs = (specs: unknown): specs is FullwidthSpecs =>
	!!specs && isObject(specs) && 'fullwidth' in specs;

const fullwidth = (specs: FullwidthSpecs, slot: HTMLElement) =>
	fastdom.mutate(() => {
		if (specs.fullwidth) {
			slot.classList.add('ad-slot--full-width');
		} else {
			slot.classList.remove('ad-slot--full-width');
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
			if (!name?.startsWith('fronts-banner') || !adSlot) {
				return;
			}

			return fullwidth(specs, adSlot);
		}
	});
};

export const _ = { fullwidth };

export { init };
