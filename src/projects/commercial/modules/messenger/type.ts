import { isString } from '@guardian/libs';
import type { RegisterListener } from 'core/messenger';
import fastdom from '../../../../lib/fastdom-promise';

const setType = (adSlotType: string, adSlot: Element) =>
	fastdom.mutate(() => {
		adSlot.classList.add(`ad-slot--${adSlotType}`);
	});

const init = (register: RegisterListener): void => {
	register('type', (specs, ret, iframe) => {
		const adSlot = iframe?.closest('.js-ad-slot');

		if (adSlot && isString(specs)) {
			void setType(specs, adSlot);
		}
	});
};

export { init };
