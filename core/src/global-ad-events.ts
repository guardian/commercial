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

const eventHistory: AdEventCustomEvent[] = [];

document.addEventListener('commercial:adStatusChange', (e: Event) => {
	const event = e as AdEventCustomEvent;
	eventHistory.push(event);
});

type AdEventCustomEvent = CustomEvent<{
	slotName: string;
	name: AdvertStatus;
	status: boolean;
}>;

function globalAdEvents(
	status: AdvertStatus | AdvertStatus[],
	slotName: string | undefined,
	listenerHandler: (event: AdEventCustomEvent) => void,
) {
	const newStatus = Array.isArray(status) ? status : [status];
	eventHistory.forEach((historyEvent) => {
		if (newStatus.includes(historyEvent.detail.name)) {
			listenerHandler(historyEvent);
		}
	});
	document.addEventListener('commercial:adStatusChange', (e: Event) => {
		const event = e as AdEventCustomEvent;
		if (newStatus.includes(event.detail.name)) {
			listenerHandler(event);
		}
	});
}

export { globalAdEvents };
