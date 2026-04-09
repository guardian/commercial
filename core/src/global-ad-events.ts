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
	if (typeof document === 'undefined') {
		return {
			remove: () => {},
		};
	}

	const parsedStatus = Array.isArray(status) ? status : [status];

	const matches = (
		event: AdEventCustomEvent,
		statusList: AdvertStatus[],
		slotName?: string,
	) => {
		const statusMatch = statusList.includes(event.detail.name);
		const slotMatch = !slotName || event.detail.slotName === slotName;
		return statusMatch && slotMatch;
	};

	const isCustomEvent = (e: Event): e is AdEventCustomEvent => {
		return (
			e instanceof CustomEvent &&
			typeof e.detail === 'object' &&
			e.detail !== null &&
			'name' in e.detail &&
			'slotName' in e.detail &&
			'status' in e.detail
		);
	};

	const listener = (e: Event) => {
		if (!isCustomEvent(e)) {
			return;
		}
		if (matches(e, parsedStatus, slotName)) {
			listenerHandler(e);
		}
	};

	eventHistory.forEach((historyEvent) => {
		if (matches(historyEvent, parsedStatus, slotName)) {
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
