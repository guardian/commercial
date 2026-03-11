import type { Advert } from '../../define/Advert';
import { type AdvertStatus } from '../../define/Advert';

type AdEventListener = {
	status: AdvertStatus | AdvertStatus[];
	callback: (advert: Advert) => void;
};
let listenerStore: AdEventListener[] = [];

/**
 * @param status - the advert status(es) to listen for
 * @param callback -  callback to run when an advert reaches the given status
 * @returns void
 */
const addListenerToStore = (
	status: AdvertStatus | AdvertStatus[],
	callback: (advert: Advert) => void,
) => {
	listenerStore.push({ status, callback });
};

/**
 * @param advert - as defined in lib/dfp/Advert
 * @returns void
 *
 *  Registers all stored listeners on the given advert.
 */
const registerAdvert = (advert: Advert) => {
	listenerStore.forEach((listener) => {
		advert.on(listener.status, () => listener.callback(advert));
	});
};

/** Clears the listener store. Used in tests. */
const clearListenerStore = () => {
	listenerStore = [];
};

export { addListenerToStore, registerAdvert, clearListenerStore };
