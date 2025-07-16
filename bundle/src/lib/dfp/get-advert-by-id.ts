import type { Advert } from '../../define/Advert';
import { dfpEnv } from './dfp-env';

const getAdvertById = (id: string): Advert | null =>
	dfpEnv.adverts.get(id) ?? null;

export { getAdvertById };
