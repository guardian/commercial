import { isString } from '@guardian/libs';
import type { RegisterListener } from 'core/messenger';
import { getAdvertById } from '../../dfp/get-advert-by-id';
import { refreshAdvert } from '../../dfp/load-advert';

const passbackRefresh = (specs: string, adSlot: HTMLElement) => {
	const advert = getAdvertById(adSlot.id);
	if (advert) {
		advert.slot.setTargeting('passback', specs);
		refreshAdvert(advert);
	}
};

const init = (register: RegisterListener): void => {
	register('passback-refresh', (specs, _, iframe) => {
		if (iframe && isString(specs)) {
			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;
			if (!adSlot) {
				return;
			}

			return passbackRefresh(specs, adSlot);
		}
	});
};

export const _ = { passbackRefresh };

export { init };
