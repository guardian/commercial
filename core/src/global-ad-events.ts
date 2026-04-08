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

type AdEventCustomEvent = CustomEvent<{
	slotName: string;
	name: AdvertStatus;
	status: boolean;
}>;

const eventHistory: AdEventCustomEvent[] = [];

document.addEventListener('commercial:adStatusChange', (e: Event) => {
	const event = e as AdEventCustomEvent;
	eventHistory.push(event);
});

function globalAdEvents(
	status: AdvertStatus | AdvertStatus[],
	listenerHandler: (event: AdEventCustomEvent) => void,
	slotName?: string,
) {
	const newStatus = Array.isArray(status) ? status : [status];
	const matches = (event: AdEventCustomEvent) => {
		const statusMatch = newStatus.includes(event.detail.name);
		const slotMatch = !slotName || event.detail.slotName === slotName;
		return statusMatch && slotMatch;
	};
	const listener = (e: Event) => {
		const event = e as AdEventCustomEvent;
		if (matches(event)) {
			listenerHandler(event);
		}
	};

	eventHistory.forEach((historyEvent) => {
		if (matches(historyEvent)) {
			listenerHandler(historyEvent);
		}
	});

	document.addEventListener('commercial:adStatusChange', listener);

	const remove = () =>
		document.removeEventListener('commercial:adStatusChange', listener);

	return { remove };
}

export const _resetHistory = () => {
	eventHistory.length = 0;
};

export { globalAdEvents, eventHistory };
export type { AdEventCustomEvent };
