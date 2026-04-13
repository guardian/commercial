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

if (typeof document !== 'undefined') {
    document.addEventListener('commercial:adStatusChange', (event) => {
        console.log('Dispatched event details:', event);
    });
}

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

function globalAdEvents(
	status: AdvertStatus | AdvertStatus[],
	listenerHandler: (event: AdEventCustomEvent) => void,
	slotName?: string,
) {
	if (typeof document !== "undefined") {
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

		const listener = (e: Event) => {
			if (isCustomEvent(e) && matches(e, parsedStatus, slotName)) {
				listenerHandler(e);
			}
		};

		document.addEventListener('commercial:adStatusChange', listener);

		return { remove: ()=>document.removeEventListener('commercial:adStatusChange', listener) };
	} 
		return { remove: () => null };
	
}

export { globalAdEvents };
export type { AdEventCustomEvent };
