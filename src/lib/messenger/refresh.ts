import type { RegisterListener } from 'core/messenger';
import { getAdvertById } from '../dfp/get-advert-by-id';
import { refreshAdvert } from '../dfp/load-advert';

const isString = (specs: unknown): specs is string => {
	return typeof specs === 'string' ? true : false;
};

const passbackRefresh = (specs: unknown | string, adSlot: HTMLElement) => {
	const advert = getAdvertById(adSlot.id);
	if (isString(specs) && advert) {
		advert.slot.setTargeting('passback', specs);
		refreshAdvert(advert);
	}
};

const init = (register: RegisterListener): void => {
	register('passback-refresh', (specs, ret, iframe) => {
		if (iframe && specs) {
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
