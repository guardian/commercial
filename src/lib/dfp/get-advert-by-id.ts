import type { Advert } from './Advert';
import { dfpEnv } from './dfp-env';

const getAdvertById = (id: string): Advert | null => {
	const advertIndex = dfpEnv.advertIds[id];
	if (advertIndex !== undefined) {
		return dfpEnv.adverts[advertIndex] ?? null;
	}
	return null;
};
export { getAdvertById };
