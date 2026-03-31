import type {
	AdEventDetail,
	AdvertListener,
	AdvertStatus,
} from '@guardian/commercial-core/global-ad-events';
import type { Advert } from '../define/Advert';
import { dfpEnv } from './dfp/dfp-env';
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
	listenStatus: AdvertStatus | AdvertStatus[],
	callback: (detail: AdEventDetail) => void | Promise<void>,
	{ once = false } = {},
): AdvertListener => {
	const currentAdverts = Array.from(dfpEnv.adverts.values());

	let listeners: AdvertListener[] = [];
	if (currentAdverts.length) {
		listeners = currentAdverts.map((advert) =>
			advert.on(
				listenStatus,
				(status) => {
					void callback({
						advertName: advert.name,
						status,
					});
				},
				{ once },
			),
		);
	}

	const globalListener = (event: Event) => {
		const { advert } = (event as CustomEvent<{ advert: Advert }>).detail;

		const createdAdvert = getAdvertById(`dfp-ad--${advert.name}`);
		if (createdAdvert) {
			listeners.push(
				createdAdvert.on(
					listenStatus,
					(status) => {
						void callback({
							advertName: createdAdvert.name,
							status,
						});
					},
					{ once },
				),
			);
		}
	};

	globalAdEvents.addEventListener('adCreated', globalListener, {
		once: true,
	});

	return {
		remove: () => {
			listeners.forEach((listener) => listener.remove());
			globalAdEvents.removeEventListener('adCreated', globalListener);
		},
	};
};

window.guardian.commercial = window.guardian.commercial ?? {};

window.guardian.commercial.onAdEvent = onAdEvent;

export { globalAdEvents, onAdEvent };
