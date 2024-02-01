import type { Advert } from '../../define/Advert';
import { dfpEnv } from './dfp-env';

export const queueAdvert = (advert: Advert): void => {
	dfpEnv.advertsToLoad.push(advert);
};
