import type {
	AdEventDetail,
	AdvertListener,
	AdvertStatus,
} from '@guardian/commercial-core/global-ad-events';
import type { Advert } from '../define/Advert';
import { getAdvertById } from './dfp/get-advert-by-id';

const globalAdEvents = new EventTarget();

/**
 * `onAdEvent` allows consumers to subscribe to specific ad events, such as when an ad is loaded or rendered, without needing direct access to the `Advert` instance.
 *
 * It works even if the advert has not been created yet by listening for the 'adCreated' event and then attaching the listener to the advert once it's available.
 *
 * @param advertName - The name of the advert to listen for events on.
 * @param listenStatus - The advert status or statuses to listen for (e.g., 'loaded', 'rendered').
 * @param cb - The callback function to execute when the specified event occurs, receiving the advert details as an argument.
 * @param options - Optional configuration for the listener, such as whether it should only trigger once.
 */
const onAdEvent = (
	advertName: string,
	listenStatus: AdvertStatus | AdvertStatus[],
	callback: (detail: AdEventDetail) => void | Promise<void>,
	{ once = false } = {},
): AdvertListener => {
	const advert = getAdvertById(`dfp-ad--${advertName}`);

	if (advert) {
		const listener = advert.on(
			listenStatus,
			(status) => {
				void callback({
					advertId: advert.id,
					advertName: advert.name,
					status,
				});
			},
			{ once },
		);

		return listener;
	}

	let listener: AdvertListener | null = null;
	const globalListener = (event: Event) => {
		const { advert } = (event as CustomEvent<{ advert: Advert }>).detail;

		const createdAdvert = getAdvertById(`dfp-ad--${advert.name}`);
		if (advert.name === advertName) {
			listener =
				createdAdvert?.on(
					listenStatus,
					(status) => {
						void callback({
							advertId: createdAdvert.id,
							advertName: createdAdvert.name,
							status,
						});
					},
					{ once },
				) ?? null;

			// Cleanup the listener for the 'adCreated' event after it has been handled
			globalAdEvents.removeEventListener('adCreated', globalListener);
			return listener;
		}
	};

	globalAdEvents.addEventListener('adCreated', globalListener, {
		once: true,
	});

	return {
		remove: () => {
			if (listener) {
				listener.remove();
			}
			globalAdEvents.removeEventListener('adCreated', globalListener);
		},
	};
};

window.guardian.commercial = window.guardian.commercial ?? {};

window.guardian.commercial.onAdEvent = onAdEvent;

export { globalAdEvents, onAdEvent };
