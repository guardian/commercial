import type { RegisterListener } from 'core/messenger';
import { getAdvertById } from '../dfp/get-advert-by-id';
import { refreshAdvert } from '../dfp/load-advert';

const checkPublicGood = (specs: unknown): boolean => {
	return typeof specs === 'string' && specs === 'public-good' ? true : false;
};

const refresh = (
	specs: unknown | string,
	iframe: HTMLIFrameElement,
	adSlot: HTMLElement,
) => {
	if (checkPublicGood(specs)) {
		const advert = getAdvertById(adSlot.id);
		if (advert) {
			advert.slot.setTargeting('passback', 'public-good');
			refreshAdvert(advert);
		}
	}
};

const init = (register: RegisterListener): void => {
	register('refresh', (specs, ret, iframe) => {
		if (iframe && specs) {
			const adSlot =
				iframe.closest<HTMLElement>('.js-ad-slot') ?? undefined;
			if (!adSlot) {
				return;
			}

			return refresh(specs, iframe, adSlot);
		}
	});
};

export const _ = { refresh };

export { init };
