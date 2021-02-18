import { trackEvent } from './GoogleAnalytics';

class Event {
	name: string;
	ts: DOMHighResTimeStamp;

	constructor(name: string, mark: PerformanceEntry) {
		this.name = name;
		this.ts = mark.startTime;
	}
}
interface GALogEvent {
	name: string;
	label: string;
}

interface GAConfig {
	logEvents: GALogEvent[];
}

interface SlotEventStatus {
	prebidStart: boolean;
	prebidEnd: boolean;
	slotInitialised: boolean;
	slotReady: boolean;
	adOnPage: boolean;
}

export class EventTimer {
	events: Event[];
	startTS: DOMHighResTimeStamp;
	triggers: {
		first: SlotEventStatus;
		'top-above-nav': SlotEventStatus;
	};
	gaConfig: GAConfig;
	gaTrackerName: string;
	/**
	 * Initalise the EventTimer class on page.
	 * Returns the singleton instance of the EventTimer class and binds
	 * to window.guardian.commercialTimer. If it's been previously
	 * initalised and bound it returns the original instance
	 * Note: We save to window.guardian.commercialTimer because
	 * different bundles (DCR / DCP) can use commercial core, and we want
	 * all timer events saved to a single instance per-page
	 * @param {string} trackerName - Name of the GA tracker
	 * @returns {EventTimer} Instance of EventTimer
	 */
	static init(gaTrackerName: string): EventTimer {
		return (window.guardian.commercialTimer ||= new EventTimer(
			gaTrackerName,
		));
	}

	/**
	 * Just a helper method to access the singleton instance of EventTimer.
	 * Typical use case is EventTimer.get().trigger
	 */
	static get(): EventTimer {
		return <EventTimer>window.guardian.commercialTimer;
	}

	constructor(gaTrackerName: string) {
		this.events = [];
		this.startTS = window.performance.now();
		this.triggers = {
			first: {
				slotReady: false,
				prebidStart: false,
				prebidEnd: false,
				slotInitialised: false,
				adOnPage: false,
			},
			'top-above-nav': {
				slotReady: false,
				prebidStart: false,
				prebidEnd: false,
				slotInitialised: false,
				adOnPage: false,
			},
		};
		this.gaConfig = {
			logEvents: [
				{
					name: 'slotReady',
					label: 'gu.commercial.slotReady',
				},
				{
					name: 'slotInitialised',
					label: 'gu.commercial.slotInitialised',
				},
			],
		};
		this.gaTrackerName = gaTrackerName;
	}

	mark(name: string): PerformanceEntry {
		const longName = `gu.commercial.${name}`;
		window.performance.mark(longName);

		// Most recent mark with this name is the event we just created.
		const mark = window.performance
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
			this.trackInGA(eventName, eventName);
			return;
		}

		if (!this.triggers.first[eventName as keyof SlotEventStatus]) {
			const trackLabel = `first-${eventName}`;
			this.mark(trackLabel);
			this.trackInGA(eventName, trackLabel);
			this.triggers.first[eventName as keyof SlotEventStatus] = true;
		}

		if (origin === TRACKEDSLOTNAME) {
			if (
				!this.triggers[TRACKEDSLOTNAME][
					eventName as keyof SlotEventStatus
				]
			) {
				const trackLabel = `${TRACKEDSLOTNAME}-${eventName}`;
				this.mark(trackLabel);
				this.trackInGA(eventName, trackLabel);
				this.triggers[TRACKEDSLOTNAME][
					eventName as keyof SlotEventStatus
				] = true;
			}
		}
	}

	trackInGA(eventName: string, label: string): void {
		const gaEvent = this.gaConfig.logEvents.find(
			(e) => e.name === eventName,
		);
		if (gaEvent) {
			trackEvent(gaEvent.label, label, 'new', this.gaTrackerName);
		}
	}
}
