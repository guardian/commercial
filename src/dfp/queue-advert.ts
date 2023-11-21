import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';

export const queueAdvert = (advert: Advert): void => {
	dfpEnv.advertsToLoad.push(advert);
};
