import { isString } from '@guardian/libs';
import { refreshAdvert } from '../../display/load-advert';
import { getAdvertById } from '../dfp/get-advert-by-id';
import type { RegisterListener } from '../messenger';

const ineligiblePassbacks = ['teadsdesktop', 'teadsmobile', 'teads'];

const passbackRefresh = (specs: string, adSlot: HTMLElement) => {
	const advert = getAdvertById(adSlot.id);
	if (advert) {
		advert.slot.setConfig({
			targeting: {
				passback: specs,
			},
		});

		// passbacks with these values are not eligible for teads
		if (ineligiblePassbacks.includes(specs)) {
			advert.slot.setConfig({
				targeting: {
					teadsEligible: 'false',
				},
			});
		}

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
