class Event {
	name: string;
	ts: DOMHighResTimeStamp;

	constructor(name: string, mark: PerformanceEntry) {
		this.name = name;
		this.ts = mark.startTime;
	}
}

interface SlotEventStatus {
	prebidStart: boolean;
	prebidEnd: boolean;
	slotInitalised: boolean;
	adOnPage: boolean;
}

export class EventTimer {
	events: Event[];
	startTS: DOMHighResTimeStamp;
	triggers: {
		first: SlotEventStatus;
		'top-above-nav': SlotEventStatus;
	};

	/**
	 * Initalise the EventTimer class on page.
	 * Returns a singleton instance of the EventTimer class and binds
	 * to window.guardian.commercialTimer. If it's been previously
	 * initalised and bound it returns the original instance
	 *
	 * @returns {EventTimer} Instance of EventTimer
	 */
	static init(): EventTimer {
		return window.guardian.commercialTimer ||= new EventTimer();
	}

	constructor() {
		this.events = [];
		this.startTS = performance.now();
		this.triggers = {
			first: {
				prebidStart: false,
				prebidEnd: false,
				slotInitalised: false,
				adOnPage: false,
			},
			'top-above-nav': {
				prebidStart: false,
				prebidEnd: false,
				slotInitalised: false,
				adOnPage: false,
			},
		};
	}

	mark(name: string): PerformanceEntry {
		const longName = `gu.commercial.${name}`;
		performance.mark(longName);

		// Most recent mark with this name is the event we just created.
		const mark = performance
			.getEntriesByName(longName, 'mark')
			.slice(-1)[0];
		this.events.push(new Event(name, mark));
		return mark;
	}

	/**
	 * Creates a new performance mark
	 * For slot events also ensures each TYPE of event event is marked only once for 'first'
	 * (the first time that event is triggered for ANY slot) and once for topAboveNav
	 *
	 * @param {string} eventName - The short name applied to the mark
	 * @param {origin} [origin=page] - Either 'page' (default) or the name of the slot
	 */
	trigger(eventName: string, origin = 'page'): void {
		const TRACKEDSLOTNAME = 'top-above-nav';
		if (origin === 'page') {
			this.mark(eventName);
			return;
		}

		if (!this.triggers.first[eventName as keyof SlotEventStatus]) {
			this.mark(`first-{eventName}`);
			this.triggers.first[eventName as keyof SlotEventStatus] = true;
		}

		if (origin === TRACKEDSLOTNAME) {
			if (
				!this.triggers[TRACKEDSLOTNAME][
					eventName as keyof SlotEventStatus
				]
			) {
				this.mark(`${TRACKEDSLOTNAME}-{eventName}`);
				this.triggers[TRACKEDSLOTNAME][
					eventName as keyof SlotEventStatus
				] = true;
			}
		}
	}
}
