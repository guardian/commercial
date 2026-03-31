type AdvertStatus =
	| 'ready'
	| 'preparing'
	| 'prepared'
	| 'fetching'
	| 'fetched'
	| 'loading'
	| 'loaded'
	| 'rendered'
	| 'refreshed';

type AdEventDetail = {
	advertName: string;
	status: AdvertStatus;
};
type GlobalAdvertEvent = CustomEvent<AdEventDetail>;

interface AdvertListener {
	remove: () => void;
}

/**
 * `onAdEvent` allows consumers to subscribe to specific ad events, such as when an ad is loaded or rendered, without needing direct access to the `Advert` instance.
 *
 * It works even if the advert has not been created yet by listening for the 'adCreated' event and then attaching the listener to the advert once it's available.
 *
 * @param listenStatus - The advert status or statuses to listen for (e.g., 'loaded', 'rendered').
 * @param cb - The callback function to execute when the specified event occurs, receiving the advert details as an argument.
 * @param options - Optional configuration for the listener, such as whether it should only trigger once.
 */
const onAdEvent = (
	listenStatus: AdvertStatus | AdvertStatus[],
	callback: (detail: AdEventDetail) => void | Promise<void>,
	{ once = false } = {},
): AdvertListener => {
	window.guardian.commercial = window.guardian.commercial ?? {};
	window.guardian.commercial.queue = window.guardian.commercial.queue ?? [];

	let listener: AdvertListener | null = null;
	window.guardian.commercial.queue.push(() => {
		if (window.guardian.commercial?.onAdEvent) {
			listener = window.guardian.commercial.onAdEvent(
				listenStatus,
				callback,
				{ once },
			);
		}
	});

	return {
		remove: () => {
			if (listener) {
				listener.remove();
			}
		},
	};
};
export { onAdEvent };
export type { AdvertStatus, AdvertListener, AdEventDetail, GlobalAdvertEvent };
