import type { Advert } from '../../define/Advert';
import { type AdvertStatus } from '../../define/Advert';

type AdEventListener = {
	status: AdvertStatus | AdvertStatus[];
	callback: (advert: Advert) => void;
};
const listenerStore: AdEventListener[] = [];

const addListenerToStore = (
	status: AdvertStatus | AdvertStatus[],
	callback: (advert: Advert) => void,
) => {
	listenerStore.push({ status, callback });
};

const registerAdvert = (advert: Advert) => {
	listenerStore.forEach((listener) => {
		advert.on(listener.status, () => listener.callback(advert));
	});
};
export { addListenerToStore, registerAdvert, listenerStore };
